#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"
PORT=5000
DEPLOY_RUN_PORT="${DEPLOY_RUN_PORT:-$PORT}"

cd "${COZE_WORKSPACE_PATH}"

echo "Starting HTTP + WebSocket service on port ${DEPLOY_RUN_PORT} for deploy..."

# 使用编译后的自定义服务器启动（支持 WebSocket）
node dist/server.js
