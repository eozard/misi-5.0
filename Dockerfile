FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

RUN npm install

COPY . .

RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]