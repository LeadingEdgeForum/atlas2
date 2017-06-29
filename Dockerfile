FROM node:8.1

WORKDIR /usr/app

COPY package.json .
RUN npm install --quiet
COPY . .
