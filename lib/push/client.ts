"use client";

import { signOut, type SignOutParams } from "next-auth/react";

export type DeviceStatus = "subscribed" | "unsubscribed" | "denied" | "unsupported" | "failed";
export type SubscribeResult = "subscribed" | "denied" | "unsupported" | "failed";

const SW_URL = "/sw.js";

export function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function isSameKey(a: ArrayBuffer | null, publicKeyB64: string): boolean {
  if (!a) return false;
  const left = new Uint8Array(a);
  const right = urlBase64ToUint8Array(publicKeyB64);
  return left.length === right.length && left.every((byte, i) => byte === right[i]);
}

function getPublicKey(): string | null {
  const config = window.__RUNTIME_CONFIG__;
  return config?.pushEnabled ? config.vapidPublicKey ?? null : null;
}

function isSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Registers the worker if needed and resolves once it is active:
 * pushManager.subscribe rejects while the worker is still installing.
 */
export async function getActiveRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration(SW_URL);
  if (existing?.active) return existing;
  if (!existing) await navigator.serviceWorker.register(SW_URL, { scope: "/" });
  return navigator.serviceWorker.ready;
}

export async function postSubscription(
  subscription: PushSubscription,
  locale: string
): Promise<void> {
  const json = subscription.toJSON();
  const res = await fetch("/api/push/subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
      locale: ["ko", "en", "ja"].includes(locale) ? locale : null,
    }),
  });
  // A watch without a stored subscription would never deliver
  if (!res.ok) {
    throw new Error(`Push subscription rejected: ${res.status}`);
  }
}

async function subscribe(
  registration: ServiceWorkerRegistration,
  publicKey: string,
  locale: string
): Promise<void> {
  const subscription = await registration.pushManager.subscribe(subscribeOptions(publicKey));
  await postSubscription(subscription, locale);
}

export async function getDeviceStatus(): Promise<DeviceStatus> {
  if (!isSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const registration = await navigator.serviceWorker.getRegistration(SW_URL);
  const subscription = await registration?.pushManager.getSubscription();
  return subscription && Notification.permission === "granted" ? "subscribed" : "unsubscribed";
}

let preparedRegistration: ServiceWorkerRegistration | null = null;

/**
 * Registers and activates the worker ahead of any tap, so the tap handler can
 * call pushManager.subscribe without awaiting anything first.
 */
export async function prepareServiceWorker(): Promise<void> {
  if (!isSupported() || !getPublicKey()) return;
  try {
    preparedRegistration = await getActiveRegistration();
  } catch (error) {
    console.error("Failed to prepare service worker:", error);
  }
}

function subscribeOptions(publicKey: string): PushSubscriptionOptionsInit {
  return {
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  };
}

/**
 * Subscribes this device; must run from a tap. iOS only allows subscribe()
 * (which also shows the permission prompt) while the tap's user activation
 * is still alive, so it is the first thing awaited.
 */
export async function ensureDeviceSubscribed(
  locale: string
): Promise<SubscribeResult> {
  const publicKey = getPublicKey();
  if (!isSupported() || !publicKey) return "unsupported";
  if (Notification.permission === "denied") return "denied";

  const registration = preparedRegistration ?? (await getActiveRegistration());
  let subscription: PushSubscription;
  try {
    subscription = await registration.pushManager.subscribe(subscribeOptions(publicKey));
  } catch (error) {
    const name = (error as DOMException).name;
    // Allowed but still rejected: the push service could not subscribe this device
    if (name === "NotAllowedError") {
      return Notification.permission === "granted" ? "failed" : "denied";
    }
    if (name !== "InvalidStateError") throw error;
    // Subscribed with an old VAPID key: replace it (permission is already granted)
    const existing = await registration.pushManager.getSubscription();
    await existing?.unsubscribe();
    subscription = await registration.pushManager.subscribe(subscribeOptions(publicKey));
  }
  await postSubscription(subscription, locale);
  return "subscribed";
}

/**
 * App-start sync without prompting: re-subscribes after a VAPID key change
 * and re-posts the subscription so the logged-in user owns this endpoint.
 */
let syncPromise: Promise<void> | null = null;

export function syncDeviceSubscription(locale: string): Promise<void> {
  // The bell remounts on every navigation; sync once per page load
  syncPromise ??= doSyncDeviceSubscription(locale);
  return syncPromise;
}

async function doSyncDeviceSubscription(locale: string): Promise<void> {
  const publicKey = getPublicKey();
  if (!isSupported() || !publicKey || Notification.permission !== "granted") return;

  try {
    const registration = await getActiveRegistration();
    const existing = await registration.pushManager.getSubscription();
    if (!existing) return;

    if (isSameKey(existing.options.applicationServerKey, publicKey)) {
      await postSubscription(existing, locale);
    } else {
      await existing.unsubscribe();
      await subscribe(registration, publicKey, locale);
    }
  } catch (error) {
    console.error("Failed to sync push subscription:", error);
  }
}

/** Detaches this device from the account, then signs out. */
export async function signOutWithPush(options?: SignOutParams): Promise<void> {
  try {
    if (isSupported()) {
      const registration = await navigator.serviceWorker.getRegistration(SW_URL);
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/subscriptions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
    }
  } catch (error) {
    console.error("Failed to detach push subscription:", error);
  }
  await signOut(options);
}
