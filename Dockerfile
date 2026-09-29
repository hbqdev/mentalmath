# syntax=docker/dockerfile:1
# Mental Math Trainer: build the static site, then serve it with the repo's own tiny server.

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:20-alpine
ENV NODE_ENV=production PORT=8547
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY scripts/serve.mjs ./scripts/serve.mjs
USER node
EXPOSE 8547
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q -O /dev/null "http://127.0.0.1:${PORT}/" || exit 1
CMD ["sh", "-c", "node scripts/serve.mjs dist \"$PORT\" 0.0.0.0"]
