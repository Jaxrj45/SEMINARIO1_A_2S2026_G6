# CloudCinema - Backend Node.js/Express (imagen de produccion)
# Build multi-stage: las devDependencies (nodemon) nunca llegan a la imagen final.

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runtime
ENV NODE_ENV=production \
    PORT=3000
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY server.js ./
COPY src ./src

# node:20-alpine ya trae el usuario "node" (uid 1000) sin privilegios.
USER node

EXPOSE 3000
CMD ["node", "server.js"]
