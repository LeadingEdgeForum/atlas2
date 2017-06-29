FROM node:8.1

WORKDIR /usr/app
EXPOSE 6001

COPY package.json .
RUN npm install --quiet
COPY . .
