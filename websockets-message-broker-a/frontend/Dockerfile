FROM node:21-alpine

WORKDIR /app

COPY .env .

COPY frontend/package.json .

RUN npm install

COPY ./frontend .

RUN npm run build

EXPOSE 8080

CMD [ "npm", "run", "preview" ]
