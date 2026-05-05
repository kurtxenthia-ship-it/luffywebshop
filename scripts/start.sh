#!/bin/sh
echo "Starting server..."
exec node --enable-source-maps artifacts/api-server/dist/index.mjs
