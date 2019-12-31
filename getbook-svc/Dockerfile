FROM node:alpine
WORKDIR /app
COPY package.json /app
RUN npm install --only=prod
COPY . /app
EXPOSE 8080
CMD node server.js
