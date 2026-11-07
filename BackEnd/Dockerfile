FROM node:26.13-slim

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run db:generate

EXPOSE 3000

CMD ["npm", "run", "dev"]