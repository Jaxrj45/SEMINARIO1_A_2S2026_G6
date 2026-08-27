FROM node:20-alpine

WORKDIR /app

# Las dependencias se copian primero para aprovechar la cache de Docker:
# si solo cambia el codigo, no se vuelve a ejecutar npm install.
COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# El contenedor NO corre como root
USER node

ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/health || exit 1

CMD ["node", "server.js"]
