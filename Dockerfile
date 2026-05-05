FROM node:20-slim

WORKDIR /app

ENV COREPACK_INTEGRITY_KEYS=0

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY . .

RUN pnpm install --no-frozen-lockfile

RUN pnpm --filter @workspace/api-server run build

RUN BASE_PATH=/ NODE_ENV=production pnpm --filter @workspace/luffy-shop run build

CMD ["sh", "scripts/start.sh"]
