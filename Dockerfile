FROM node:8.11.3-alpine

ENV NODE_ENV production

RUN apk add --no-cache su-exec
RUN apk add --no-cache --virtual .build-deps build-base python
RUN mkdir -p /quinoa-server/

ADD . /quinoa-server
WORKDIR /quinoa-server
RUN npm install --quiet --production false
RUN apk del .build-deps

ENTRYPOINT ["su-exec", "node:node"]
CMD ["/usr/local/bin/npm", "start"]
