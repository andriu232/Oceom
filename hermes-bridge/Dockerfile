FROM node:22-alpine

WORKDIR /app

# Las dependencias primero: así Docker reutiliza la capa mientras el código
# cambie pero el package.json no.
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY src ./src

# La sesión de WhatsApp vive aquí. Monta un VOLUMEN PERSISTENTE en esta ruta
# o cada redeploy pedirá escanear el QR de nuevo.
ENV AUTH_DIR=/data/auth
VOLUME ["/data"]

ENV PORT=8080
EXPOSE 8080

CMD ["node", "src/index.js"]
