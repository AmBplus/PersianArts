#!/usr/bin/env bash
# One-line install of persian-arts on macOS/Linux after git clone:  bash install.sh [--dry-run] [--check] [--no-skill]
# Idempotent, non-interactive. Installs only MISSING prerequisites (brew/apt/dnf). Log: work/persian/_install/install.log (ignored).
set -u
ROOT="$(cd "$(dirname "$0")" && pwd)"; cd "$ROOT"
DRY=0; CHECK=0; SKILL=1
for a in "$@"; do case "$a" in --dry-run) DRY=1;; --check) CHECK=1;; --no-skill) SKILL=0;; esac; done
LOG="$ROOT/work/persian/_install/install.log"; mkdir -p "$(dirname "$LOG")"
say() { echo "$*"; echo "$(date +%FT%T) $*" >> "$LOG"; }
have() { command -v "$1" >/dev/null 2>&1; }
OS=linux; [ "$(uname)" = "Darwin" ] && OS=macos
PM=""; if [ "$OS" = macos ]; then have brew && PM=brew; else if have apt-get; then PM=apt; elif have dnf; then PM=dnf; fi; fi
say "persian-arts install: OS=$OS package-manager=${PM:-none} root=$ROOT dryrun=$DRY check=$CHECK"
pkg() { # name cmd brew apt dnf
  local name=$1 cmd=$2 b=$3 a=$4 d=$5
  if have "$cmd"; then say "  [skip] $name already installed ($cmd)"; return; fi
  local line=""; case "$PM" in brew) line="brew install $b";; apt) line="sudo apt-get install -y $a";; dnf) line="sudo dnf install -y $d";; esac
  if [ -z "$line" ]; then say "  [WARN] $name missing and no package manager: install it manually"; return; fi
  if [ $DRY = 1 ]; then say "  [dry-run] would run: $line"; else say "  [install] $line"; eval "$line" >> "$LOG" 2>&1; fi
}
if [ $CHECK = 0 ]; then
  pkg git git git git git
  pkg node node node@22 "nodejs npm" "nodejs npm"
  pkg python python3 python@3.12 "python3 python3-venv python3-pip" "python3 python3-pip"
  pkg ffmpeg ffmpeg ffmpeg ffmpeg ffmpeg
  pkg pwsh pwsh powershell powershell powershell
  pkg openssl openssl openssl openssl openssl
fi
have node || { say "node missing: install it, open a new shell and rerun install.sh"; exit 1; }
PA="$ROOT/work/persian/tools/portable/pa-portable.mjs"
if [ $DRY = 1 ]; then say "  [dry-run] plan: bootstrap (venvs, npm ci, Remotion browser, fonts, .env from examples, kit verify), install-skill --user/--agents, doctor"; node "$PA" bootstrap --dry-run; exit 0; fi
if [ $CHECK = 1 ]; then node "$PA" doctor; rc=$?; node "$PA" install-skill --check; exit $rc; fi
node "$PA" bootstrap 2>&1 | tee -a "$LOG"
if [ $SKILL = 1 ]; then node "$PA" install-skill --user 2>&1 | tee -a "$LOG"; node "$PA" install-skill --agents 2>&1 | tee -a "$LOG"; fi
say "done. Open Claude Code here (or in any project) and use /persian-arts. Manual only: git SSH auth, optional API keys, PA_VAULT_PASS."
