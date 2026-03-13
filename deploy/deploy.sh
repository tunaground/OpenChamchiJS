#!/bin/bash
set -euo pipefail

STACK_NAME="chamchi"
COMPOSE_FILE="docker-compose.swarm.yml"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$SCRIPT_DIR"

IMAGES=(
  "web ghcr.io/tunaground/openchamchijs APP_VERSION"
  "ws  ghcr.io/tunaground/openchamchijs-ws-server WS_VERSION"
)

current_version() {
  local service="$1"
  docker service inspect --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}' \
    "${STACK_NAME}_${service}" 2>/dev/null | sed 's/.*://' | sed 's/@.*//'
}

stack_deploy() {
  docker compose -f "$COMPOSE_FILE" --env-file .env config \
    | docker stack deploy -c - "$STACK_NAME"
}

deploy() {
  local target="${1:-}"
  local version="${2:-}"

  for entry in "${IMAGES[@]}"; do
    local name=$(echo "$entry" | awk '{print $1}')
    local var=$(echo "$entry" | awk '{print $3}')

    if [ "$name" = "$target" ] && [ -n "$version" ]; then
      export "$var=$version"
      echo "Deploying ${name}: ${version}"
    else
      local cur
      cur=$(current_version "$name")
      if [ -n "$cur" ]; then
        export "$var=$cur"
      fi
    fi
  done

  stack_deploy
}

rollback() {
  local service="${1:?Usage: $0 rollback <service>}"
  echo "Rolling back ${service}..."
  docker service rollback "${STACK_NAME}_${service}"
}

case "${1:-}" in
  init)
    echo "Initializing stack '$STACK_NAME'..."
    stack_deploy
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
    echo "  $0 deploy [service] [version]"
    echo "  $0 rollback <service>"
    echo ""
    echo "Services: web, ws"
    exit 1
    ;;
esac
