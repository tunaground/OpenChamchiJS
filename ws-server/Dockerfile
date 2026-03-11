FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 wsuser
COPY --from=deps /app/node_modules ./node_modules
COPY server.mjs ./
USER wsuser
EXPOSE 4000
CMD ["node", "server.mjs"]
