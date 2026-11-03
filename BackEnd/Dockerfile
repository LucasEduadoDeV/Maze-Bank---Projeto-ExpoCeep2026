FROM node:26.13-slim

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

CMD [ "npm", "run", "dev" ]

EXPOSE 3000

RUN npm run db:generate