#!/bin/bash
set -euo pipefail

STACK_NAME="chamchi"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$SCRIPT_DIR"

service_for() {
  case "$1" in
    web) echo "ghcr.io/tunaground/openchamchijs" ;;
    ws)  echo "ghcr.io/tunaground/openchamchijs-ws-server" ;;
    *)   echo "Unknown service: $1" >&2; exit 1 ;;
  esac
}

deploy() {
  local service="${1:?Usage: $0 deploy <service> <version>}"
  local version="${2:?Usage: $0 deploy <service> <version>}"
  local image
  image="$(service_for "$service"):${version}"

  echo "Deploying ${service}: ${image}"
  docker service update --image "$image" "${STACK_NAME}_${service}"
}

rollback() {
  local service="${1:?Usage: $0 rollback <service>}"
  service_for "$service" > /dev/null

  echo "Rolling back ${service}..."
  docker service rollback "${STACK_NAME}_${service}"
}

init() {
  echo "Initializing stack '$STACK_NAME'..."
  docker compose -f docker-compose.swarm.yml --env-file .env config \
    | docker stack deploy -c - "$STACK_NAME"
}

case "${1:-}" in
  init)
    init
    ;;
  deploy)
    deploy "${2:-}" "${3:-}"
    ;;
  rollback)
    rollback "${2:-}"
    ;;
  *)
    echo "Usage:"
    echo "  $0 init"
    echo "  $0 deploy <service> <version>"
    echo "  $0 rollback <service>"
    echo ""
    echo "Services: web, ws"
    exit 1
    ;;
esac
