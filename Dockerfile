FROM --platform=linux/amd64 node:18

WORKDIR /app

COPY . /app

RUN npm install

CMD [ "node", "coeTablebaatch.js" ]