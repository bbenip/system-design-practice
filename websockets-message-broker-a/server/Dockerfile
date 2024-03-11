FROM node:21-alpine

WORKDIR /app

COPY .env .

COPY server/package.json .

RUN npm install

COPY ./server .

EXPOSE 8001

CMD [ "npm", "run", "start" ]
