import { createServer } from "http";
import { createHmac } from "crypto";
import { WebSocketServer } from "ws";

const PORT = parseInt(process.env.WS_PORT || "4000", 10);
const API_KEY = process.env.WS_API_KEY;
const TOKEN_SECRET = process.env.WS_TOKEN_SECRET;

if (!API_KEY || !TOKEN_SECRET) {
  console.error("WS_API_KEY and WS_TOKEN_SECRET must be set");
  process.exit(1);
}

// In-memory state
const channels = new Map(); // Map<channel, Set<ws>>
const presence = new Map(); // Map<channel, Map<clientId, Set<ws>>>

/**
 * Verify a client token: payload.signature
 * payload = base64url({ clientId, exp })
 * signature = HMAC-SHA256(payload, TOKEN_SECRET)
 */
function verifyToken(token) {
  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) return null;

  const payload = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);

  const expected = createHmac("sha256", TOKEN_SECRET)
    .update(payload)
    .digest("base64url");

  if (signature !== expected) return null;

  try {
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );
    if (decoded.exp && Date.now() > decoded.exp) return null;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Broadcast a message to all subscribers of a channel
 */
function broadcastToChannel(channel, message) {
  const subs = channels.get(channel);
  if (!subs) return;
  const data = JSON.stringify(message);
  for (const ws of subs) {
    if (ws.readyState === 1) {
      ws.send(data);
    }
  }
}

/**
 * Get deduplicated presence members for a channel
 */
function getPresenceMembers(channel) {
  const channelPresence = presence.get(channel);
  if (!channelPresence) return [];
  return Array.from(channelPresence.keys()).map((id) => ({ oderId: id }));
}

/**
 * Broadcast presence update to all subscribers of a channel
 */
function broadcastPresenceUpdate(channel) {
  const members = getPresenceMembers(channel);
  broadcastToChannel(channel, {
    type: "presence:update",
    channel,
    members,
  });
}

/**
 * Remove a WebSocket from all channels and presence
 */
function cleanupConnection(ws) {
  // Remove from channel subscriptions
  for (const [channel, subs] of channels) {
    subs.delete(ws);
    if (subs.size === 0) channels.delete(channel);
  }

  // Remove from presence
  for (const [channel, channelPresence] of presence) {
    let changed = false;
    for (const [clientId, connections] of channelPresence) {
      connections.delete(ws);
      if (connections.size === 0) {
        channelPresence.delete(clientId);
        changed = true;
      }
    }
    if (channelPresence.size === 0) {
      presence.delete(channel);
    }
    if (changed) {
      broadcastPresenceUpdate(channel);
    }
  }
}

// HTTP server
const server = createServer((req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.method === "GET" && (req.url === "/health" || req.url === "/ws/health")) {
    let totalConnections = 0;
    for (const subs of channels.values()) {
      totalConnections += subs.size;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", connections: totalConnections }));
    return;
  }

  // Publish endpoint
  if (req.method === "POST" && (req.url === "/publish" || req.url === "/ws/publish")) {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${API_KEY}`) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }

    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        const { channel, event, data } = JSON.parse(body);
        if (!channel || !event) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "channel and event are required" }));
          return;
        }
        broadcastToChannel(channel, {
          type: "message",
          channel,
          event,
          data,
        });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

// WebSocket server
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // Accept WebSocket upgrade on /ws path
  if (url.pathname !== "/ws") {
    socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    socket.destroy();
    return;
  }

  const token = url.searchParams.get("token");

  if (!token) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    ws.clientId = decoded.clientId;
    ws.subscribedChannels = new Set();
    ws.presenceChannels = new Set();
    wss.emit("connection", ws, req);
  });
});

wss.on("connection", (ws) => {
  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    const { type, channel } = msg;
    if (!type || !channel) return;

    switch (type) {
      case "subscribe": {
        if (!channels.has(channel)) channels.set(channel, new Set());
        channels.get(channel).add(ws);
        ws.subscribedChannels.add(channel);
        break;
      }

      case "unsubscribe": {
        const subs = channels.get(channel);
        if (subs) {
          subs.delete(ws);
          if (subs.size === 0) channels.delete(channel);
        }
        ws.subscribedChannels.delete(channel);
        break;
      }

      case "presence:enter": {
        if (!presence.has(channel)) presence.set(channel, new Map());
        const channelPresence = presence.get(channel);
        if (!channelPresence.has(ws.clientId)) {
          channelPresence.set(ws.clientId, new Set());
        }
        channelPresence.get(ws.clientId).add(ws);
        ws.presenceChannels.add(channel);

        // Also subscribe to the channel for receiving messages
        if (!channels.has(channel)) channels.set(channel, new Set());
        channels.get(channel).add(ws);
        ws.subscribedChannels.add(channel);

        broadcastPresenceUpdate(channel);
        break;
      }

      case "presence:leave": {
        const cp = presence.get(channel);
        if (cp) {
          const connections = cp.get(ws.clientId);
          if (connections) {
            connections.delete(ws);
            if (connections.size === 0) cp.delete(ws.clientId);
          }
          if (cp.size === 0) presence.delete(channel);
          broadcastPresenceUpdate(channel);
        }
        ws.presenceChannels.delete(channel);
        break;
      }

      case "presence:get": {
        const members = getPresenceMembers(channel);
        if (ws.readyState === 1) {
          ws.send(
            JSON.stringify({
              type: "presence:members",
              channel,
              members,
            })
          );
        }
        break;
      }
    }
  });

  ws.on("close", () => {
    cleanupConnection(ws);
  });

  ws.on("error", () => {
    cleanupConnection(ws);
  });
});

// Heartbeat to detect dead connections
const HEARTBEAT_INTERVAL = 30000;
setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) {
      cleanupConnection(ws);
      ws.terminate();
      continue;
    }
    ws.isAlive = false;
    ws.ping();
  }
}, HEARTBEAT_INTERVAL);

wss.on("connection", (ws) => {
  ws.isAlive = true;
  ws.on("pong", () => {
    ws.isAlive = true;
  });
});

server.listen(PORT, () => {
  console.log(`WebSocket server listening on port ${PORT}`);
});
