#!/usr/bin/env bash
# "Project" runButton coordinator for AdClaw.
#
# The Replit platform starts all five managed artifact workflows in parallel
# when this workflow runs.  This script waits for each service to become
# reachable, prints clear pass/fail output, and keeps the workflow alive so
# developers can see "running" in the workflow panel.

set -uo pipefail

# ── Colour helpers (graceful no-op outside a TTY) ────────────────────────────
if [ -t 1 ]; then
  BOLD='\033[1m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
else
  BOLD=''; GREEN=''; YELLOW=''; RED=''; NC=''
fi

echo -e "${BOLD}╔══════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║   AdClaw – monitoring all services        ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════╝${NC}"
echo -e "${YELLOW}Waiting for services to become reachable…${NC}"
echo ""

# ── Health-check helper ───────────────────────────────────────────────────────
# check_service <label> <port> <path> [max_wait_seconds]
check_service() {
  local label="$1"
  local port="$2"
  local path="$3"
  local max_wait="${4:-90}"
  local waited=0
  local url="http://localhost:${port}${path}"

  while [ "$waited" -lt "$max_wait" ]; do
    if curl -sf --max-time 3 "$url" > /dev/null 2>&1; then
      echo -e "  ${GREEN}✓${NC} ${BOLD}${label}${NC}  →  ${url}"
      return 0
    fi
    sleep 3
    waited=$((waited + 3))
  done

  echo -e "  ${RED}✗${NC} ${BOLD}${label}${NC} did not respond on ${url} within ${max_wait}s" >&2
  return 1
}

# ── Check every service in parallel ──────────────────────────────────────────
PIDS=()

check_service "API Server      (api-server)"   8080  "/api/healthz" 90 & PIDS+=("$!")
check_service "AdClaw AI       (adclaw-ai)"    23476 "/"            90 & PIDS+=("$!")
check_service "AdClaw Mobile   (adclaw-mobile)" 23997 "/status"     90 & PIDS+=("$!")
check_service "AdFlow Landing  (adflow-land)"  22849 "/adflow-landing/" 90 & PIDS+=("$!")
check_service "Mockup Sandbox  (mockup-sand)"  8081  "/__mockup"    90 & PIDS+=("$!")

# ── Collect results ───────────────────────────────────────────────────────────
FAILED=0
for PID in "${PIDS[@]}"; do
  wait "$PID" || FAILED=$((FAILED + 1))
done

echo ""
if [ "$FAILED" -eq 0 ]; then
  echo -e "${GREEN}${BOLD}All 5 services are up and reachable.${NC}"
  echo -e "Open the Preview tab to use AdClaw AI, or check individual workflow"
  echo -e "panels for service-specific logs."
  echo ""
  echo -e "${YELLOW}Keeping workflow alive – Ctrl-C to stop all services.${NC}"
  # Hold the workflow in "running" state; Ctrl-C / SIGTERM will kill everything
  # via the shell's job-control (the platform sends SIGTERM on workflow stop).
  while true; do sleep 60; done
else
  echo -e "${RED}${BOLD}${FAILED} service(s) failed to start within 90 s.${NC}" >&2
  echo -e "Check the individual workflow logs for the failing service(s)." >&2
  exit 1
fi
