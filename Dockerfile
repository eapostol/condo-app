FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client ./
RUN npm run build

FROM node:20-alpine AS server
WORKDIR /app
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install
COPY server ./
COPY --from=client-build /app/client/dist ./public
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "/app/server/../server.js"]
