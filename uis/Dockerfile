# Dockerfile para el contenedor de interfaces (website + backoffice)
# Basado en Node 22 Alpine para imagen ligera
FROM node:22-alpine

WORKDIR /app

# Copiar solo los package.json y lockfiles primero para aprovechar la caché de capas
COPY website/package.json website/package-lock.json ./website/
COPY backoffice/package.json backoffice/package-lock.json ./backoffice/

# Instalar dependencias de website
RUN cd /app/website && npm ci

# Instalar dependencias de backoffice
RUN cd /app/backoffice && npm ci

# Copiar el resto del código fuente
COPY website/ ./website/
COPY backoffice/ ./backoffice/
COPY start.sh ./start.sh

# Exponer los puertos de desarrollo
EXPOSE 3000
EXPOSE 3001

# Comando por defecto: arrancar ambas aplicaciones Next.js
CMD ["sh", "/app/start.sh"]