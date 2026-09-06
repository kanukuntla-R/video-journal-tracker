#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE_DIR="$ROOT_DIR/.dev"
PID_DIR="$STATE_DIR/pids"
LOG_DIR="$STATE_DIR/logs"

mkdir -p "$PID_DIR" "$LOG_DIR"

BACKEND_PID_FILE="$PID_DIR/backend.pid"
FRONTEND_PID_FILE="$PID_DIR/frontend.pid"
OLLAMA_PID_FILE="$PID_DIR/ollama.pid"

MONGO_FORMULA="${MONGO_FORMULA:-mongodb-community@7.0}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
OLLAMA_PORT="${OLLAMA_PORT:-11434}"
MONGO_PORT="${MONGO_PORT:-27017}"

info() {
  printf "\033[1;34m%s\033[0m\n" "$*"
}

ok() {
  printf "\033[1;32m%s\033[0m\n" "$*"
}

warn() {
  printf "\033[1;33m%s\033[0m\n" "$*"
}

fail() {
  printf "\033[1;31m%s\033[0m\n" "$*" >&2
  exit 1
}

have_command() {
  command -v "$1" >/dev/null 2>&1
}

is_port_open() {
  local port="$1"
  lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
}

port_pids() {
  local port="$1"
  lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true
}

pid_is_running() {
  local pid_file="$1"
  [[ -f "$pid_file" ]] && [[ -n "$(cat "$pid_file")" ]] && kill -0 "$(cat "$pid_file")" >/dev/null 2>&1
}

stop_pid() {
  local pid="$1"

  kill "$pid" >/dev/null 2>&1 || true
  for _ in {1..25}; do
    kill -0 "$pid" >/dev/null 2>&1 || return 0
    sleep 0.2
  done

  kill -9 "$pid" >/dev/null 2>&1 || true
  return 0
}

stop_pid_file() {
  local name="$1"
  local pid_file="$2"

  if pid_is_running "$pid_file"; then
    local pid
    pid="$(cat "$pid_file")"
    info "Stopping $name ($pid)"
    stop_pid "$pid"
  fi

  rm -f "$pid_file"
}

stop_port_listener() {
  local name="$1"
  local port="$2"
  local pids

  pids="$(port_pids "$port")"
  [[ -n "$pids" ]] || return

  while IFS= read -r pid; do
    [[ -n "$pid" ]] || continue
    info "Stopping $name listener on port $port ($pid)"
    stop_pid "$pid"
  done <<<"$pids"
}

stop_mongo_port_listener() {
  local pids
  pids="$(port_pids "$MONGO_PORT")"
  [[ -n "$pids" ]] || return

  while IFS= read -r pid; do
    [[ -n "$pid" ]] || continue

    if ps -p "$pid" -o comm= -o args= 2>/dev/null | grep -q "mongod"; then
      info "Stopping MongoDB listener on port $MONGO_PORT ($pid)"
      stop_pid "$pid"
    else
      warn "Port $MONGO_PORT is used by pid $pid, but it does not look like mongod. Leaving it running."
    fi
  done <<<"$pids"
}

brew_formula_installed() {
  have_command brew && brew list --formula "$1" >/dev/null 2>&1
}

start_mongo() {
  if is_port_open "$MONGO_PORT"; then
    info "MongoDB already running on port $MONGO_PORT"
    return
  fi

  if ! have_command brew; then
    warn "Homebrew not found. Start MongoDB manually or use Docker."
    return
  fi

  if ! brew_formula_installed "$MONGO_FORMULA"; then
    warn "MongoDB formula '$MONGO_FORMULA' is not installed. Install it or use Docker."
    return
  fi

  info "Starting MongoDB ($MONGO_FORMULA)"
  brew services start "$MONGO_FORMULA" >/dev/null
}

stop_mongo() {
  if have_command brew && brew_formula_installed "$MONGO_FORMULA"; then
    info "Stopping MongoDB ($MONGO_FORMULA)"
    brew services stop "$MONGO_FORMULA" >/dev/null 2>&1 || true
  fi

  stop_mongo_port_listener
}

start_ollama() {
  if is_port_open "$OLLAMA_PORT"; then
    info "Ollama already running on port $OLLAMA_PORT"
    return
  fi

  if ! have_command ollama; then
    warn "Ollama not found. Install it or start it manually when testing AI features."
    return
  fi

  info "Starting Ollama"
  nohup ollama serve >"$LOG_DIR/ollama.log" 2>&1 &
  echo "$!" >"$OLLAMA_PID_FILE"
}

start_backend() {
  if is_port_open "$BACKEND_PORT"; then
    info "Backend already running on port $BACKEND_PORT"
    return
  fi

  [[ -x "$ROOT_DIR/venv/bin/python" ]] || fail "Missing venv. Run: python3 -m venv venv && venv/bin/python -m pip install -r backend/requirements.txt"

  info "Starting backend on port $BACKEND_PORT"
  (
    cd "$ROOT_DIR"
    nohup env PYTHONPATH=. venv/bin/python -m uvicorn backend.api_gateway.main:app --reload --host 0.0.0.0 --port "$BACKEND_PORT" >"$LOG_DIR/backend.log" 2>&1 &
    echo "$!" >"$BACKEND_PID_FILE"
  )
}

start_frontend() {
  if is_port_open "$FRONTEND_PORT"; then
    info "Frontend already running on port $FRONTEND_PORT"
    return
  fi

  [[ -d "$ROOT_DIR/frontend/node_modules" ]] || fail "Missing frontend/node_modules. Run: cd frontend && npm install"

  info "Starting frontend on port $FRONTEND_PORT"
  (
    cd "$ROOT_DIR/frontend"
    nohup npm run dev -- --host 0.0.0.0 --port "$FRONTEND_PORT" >"$LOG_DIR/frontend.log" 2>&1 &
    echo "$!" >"$FRONTEND_PID_FILE"
  )
}

stop_frontend() {
  stop_pid_file "frontend" "$FRONTEND_PID_FILE"
  stop_port_listener "frontend" "$FRONTEND_PORT"
}

stop_backend() {
  stop_pid_file "backend" "$BACKEND_PID_FILE"
  stop_port_listener "backend" "$BACKEND_PORT"
}

stop_ollama() {
  stop_pid_file "ollama" "$OLLAMA_PID_FILE"
  stop_port_listener "Ollama" "$OLLAMA_PORT"
}

start_all() {
  start_mongo
  start_ollama
  start_backend
  start_frontend

  info ""
  ok "Dev stack started"
  printf "Frontend: http://localhost:%s\n" "$FRONTEND_PORT"
  printf "Backend:  http://localhost:%s/docs\n" "$BACKEND_PORT"
  printf "Logs:     %s\n" "$LOG_DIR"
}

stop_all() {
  stop_frontend
  stop_backend
  stop_ollama
  stop_mongo

  ok "Dev stack stopped"
}

restart_all() {
  stop_all
  start_all
}

status_line() {
  local name="$1"
  local port="$2"
  if is_port_open "$port"; then
    printf "%-9s running on port %s\n" "$name" "$port"
  else
    printf "%-9s stopped\n" "$name"
  fi
}

status_all() {
  status_line "Frontend" "$FRONTEND_PORT"
  status_line "Backend" "$BACKEND_PORT"
  status_line "MongoDB" "$MONGO_PORT"
  status_line "Ollama" "$OLLAMA_PORT"
}

status_service() {
  case "${1:-all}" in
    all) status_all ;;
    frontend) status_line "Frontend" "$FRONTEND_PORT" ;;
    backend) status_line "Backend" "$BACKEND_PORT" ;;
    mongo|mongodb) status_line "MongoDB" "$MONGO_PORT" ;;
    ollama) status_line "Ollama" "$OLLAMA_PORT" ;;
    *) fail "Unknown service: $1" ;;
  esac
}

start_service() {
  case "${1:-all}" in
    all) start_all ;;
    frontend) start_frontend ;;
    backend) start_backend ;;
    mongo|mongodb) start_mongo ;;
    ollama) start_ollama ;;
    *) fail "Unknown service: $1" ;;
  esac
}

stop_service() {
  case "${1:-all}" in
    all) stop_all ;;
    frontend) stop_frontend ;;
    backend) stop_backend ;;
    mongo|mongodb) stop_mongo ;;
    ollama) stop_ollama ;;
    *) fail "Unknown service: $1" ;;
  esac
}

restart_service() {
  local service="${1:-all}"
  stop_service "$service"
  start_service "$service"
}

show_logs() {
  local target="${1:-all}"
  case "$target" in
    backend|frontend|ollama)
      touch "$LOG_DIR/$target.log"
      tail -f "$LOG_DIR/$target.log"
      ;;
    all)
      touch "$LOG_DIR/backend.log" "$LOG_DIR/frontend.log" "$LOG_DIR/ollama.log"
      tail -f "$LOG_DIR"/*.log
      ;;
    *)
      fail "Unknown log target: $target"
      ;;
  esac
}

doctor_check() {
  local name="$1"
  local message="$2"

  if eval "$message" >/dev/null 2>&1; then
    printf "OK   %s\n" "$name"
  else
    printf "MISS %s\n" "$name"
  fi
}

doctor_all() {
  doctor_check "node" "command -v node"
  doctor_check "npm" "command -v npm"
  doctor_check "python venv" "test -x '$ROOT_DIR/venv/bin/python'"
  doctor_check "frontend deps" "test -d '$ROOT_DIR/frontend/node_modules'"
  doctor_check "ffmpeg" "command -v ffmpeg"
  doctor_check "ollama" "command -v ollama"
  doctor_check "mongo formula" "brew list --formula '$MONGO_FORMULA'"
  echo
  status_all
}

test_frontend() {
  info "Running frontend lint"
  (cd "$ROOT_DIR/frontend" && npm run lint)

  info "Running frontend build"
  (cd "$ROOT_DIR/frontend" && npm run build)
}

test_backend() {
  [[ -x "$ROOT_DIR/venv/bin/python" ]] || fail "Missing venv. Run: python3 -m venv venv && venv/bin/python -m pip install -r backend/requirements.txt"

  info "Checking Python imports"
  (cd "$ROOT_DIR" && PYTHONPATH=. venv/bin/python -m compileall backend -q)

  info "Checking Python dependencies"
  (cd "$ROOT_DIR" && venv/bin/python -m pip check)
}

test_security() {
  info "Running npm audit"
  (cd "$ROOT_DIR/frontend" && npm audit --audit-level=moderate)

  if [[ -x "$ROOT_DIR/venv/bin/pip-audit" ]]; then
    info "Running pip-audit"
    (cd "$ROOT_DIR" && venv/bin/pip-audit -r backend/requirements.txt)
  else
    warn "pip-audit is not installed in venv; skipping Python vulnerability scan."
  fi
}

test_all() {
  test_frontend
  test_backend
  test_security
}

docker_up() {
  have_command docker || fail "Docker is not installed or not on PATH."
  (cd "$ROOT_DIR" && docker compose up --build)
}

docker_down() {
  have_command docker || fail "Docker is not installed or not on PATH."
  (cd "$ROOT_DIR" && docker compose down)
}

docker_logs() {
  have_command docker || fail "Docker is not installed or not on PATH."
  if [[ -n "${1:-}" ]]; then
    (cd "$ROOT_DIR" && docker compose logs -f "$1")
  else
    (cd "$ROOT_DIR" && docker compose logs -f)
  fi
}

usage() {
  cat <<EOF
Usage:
  ./vjt dev <start|stop|restart|status|doctor>
  ./vjt service <start|stop|restart|status> [all|backend|frontend|mongo|ollama]
  ./vjt logs [all|backend|frontend|ollama]
  ./vjt test <all|frontend|backend|security>
  ./vjt docker <up|down|logs>

Shortcuts still work:
  ./scripts/dev.sh start
  ./scripts/dev.sh stop
  make dev
  make stop

Examples:
  ./vjt dev start
  ./vjt service restart frontend
  ./vjt dev status
  ./vjt logs backend
  ./vjt test all
  ./vjt dev stop
EOF
}

dev_command() {
  case "${1:-}" in
    start) start_service "${2:-all}" ;;
    stop) stop_service "${2:-all}" ;;
    restart) restart_service "${2:-all}" ;;
    status) status_service "${2:-all}" ;;
    doctor) doctor_all ;;
    "") usage; exit 1 ;;
    *) fail "Unknown dev command: $1" ;;
  esac
}

service_command() {
  local action="${1:-}"
  local service="${2:-all}"

  case "$action" in
    start) start_service "$service" ;;
    stop) stop_service "$service" ;;
    restart) restart_service "$service" ;;
    status) status_service "$service" ;;
    "") usage; exit 1 ;;
    *) fail "Unknown service action: $action" ;;
  esac
}

logs_command() {
  show_logs "${1:-all}"
}

test_command() {
  case "${1:-}" in
    all|"") test_all ;;
    frontend) test_frontend ;;
    backend) test_backend ;;
    security) test_security ;;
    *) fail "Unknown test target: $1" ;;
  esac
}

docker_command() {
  case "${1:-}" in
    up) docker_up ;;
    down) docker_down ;;
    logs) docker_logs "${2:-}" ;;
    "") usage; exit 1 ;;
    *) fail "Unknown docker command: $1" ;;
  esac
}

main() {
  case "${1:-}" in
    dev)
      shift
      dev_command "$@"
      ;;
    service)
      shift
      service_command "$@"
      ;;
    logs)
      shift
      logs_command "$@"
      ;;
    test)
      shift
      test_command "$@"
      ;;
    docker)
      shift
      docker_command "$@"
      ;;
    doctor)
      doctor_all
      ;;
    help|-h|--help|"")
      usage
      ;;
    start|stop|restart|status)
      dev_command "$@"
      ;;
    *)
      fail "Unknown command: $1"
      ;;
  esac
}

main "$@"
