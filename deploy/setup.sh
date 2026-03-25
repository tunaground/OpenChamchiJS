#!/bin/bash
set -euo pipefail

echo "=== OpenChamchiJS EC2 Setup (Amazon Linux 2023) ==="

# Docker
sudo dnf install -y docker
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"

# Docker Compose
COMPOSE_URL="https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m)"
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL "$COMPOSE_URL" -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# App directory
mkdir -p ~/openchamchijs
cp docker-compose.yml ~/openchamchijs/

# GeoLite2 mmdb
if [ -n "${MAXMIND_LICENSE_KEY:-}" ]; then
  echo "Downloading GeoLite2-Country database..."
  curl -L -o /tmp/GeoLite2-Country.tar.gz \
    "https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-Country&license_key=${MAXMIND_LICENSE_KEY}&suffix=tar.gz"
  tar -xzf /tmp/GeoLite2-Country.tar.gz -C /tmp
  mv /tmp/GeoLite2-Country_*/GeoLite2-Country.mmdb ~/openchamchijs/
  rm -rf /tmp/GeoLite2-Country.tar.gz /tmp/GeoLite2-Country_*
  echo "GeoLite2-Country.mmdb downloaded."
else
  echo "MAXMIND_LICENSE_KEY not set, skipping mmdb download."
fi

echo ""
echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "  1. Log out and back in (for docker group)"
echo "  2. Log in to GHCR:"
echo "     echo \"YOUR_PAT\" | docker login ghcr.io -u YOUR_USERNAME --password-stdin"
echo "  3. Create ~/openchamchijs/.env with environment variables"
echo "  4. Start:"
echo "     cd ~/openchamchijs && docker compose up -d"
