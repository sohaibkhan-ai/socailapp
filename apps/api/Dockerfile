# ---- deps + build ----
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
COPY prisma ./prisma
RUN npm install --no-audit --no-fund && npx prisma generate
# ---- runtime ----
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl && addgroup -S app && adduser -S app -G app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./
COPY prisma ./prisma
COPY src ./src
RUN mkdir -p uploads && chown -R app:app /app
USER app
EXPOSE 3000
CMD ["node", "src/main.js"]
