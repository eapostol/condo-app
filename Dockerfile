FROM node:20-alpine AS client-build

# Root package.json is required because client/package.json references "app": "file:.."
WORKDIR /app
COPY package*.json ./

WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client ./
RUN npm run build

FROM node:20-alpine AS server

# Root package.json is required because server/package.json references "app": "file:.."
WORKDIR /app
COPY package*.json ./

COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install
COPY server ./

# Copy the built frontend into the backend's static folder
COPY --from=client-build /app/client/dist ./public

# Seed-once entrypoint
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV NODE_ENV=production
EXPOSE 5000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "/app/server/server.js"]
