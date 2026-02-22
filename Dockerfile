FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
# Install all dependencies (dev deps included) for development container
# Use `npm install` to allow installing after package.json changes without lockfile mismatch
RUN npm install
COPY . .
RUN npm run build || true
RUN chmod +x ./scripts/wait-for-db.sh || true
EXPOSE 4000
CMD ["sh", "-c", "./scripts/wait-for-db.sh ${DB_HOST:-mysql} ${DB_PORT:-3306} && npm run migrate:run && npm run start:dev"]
