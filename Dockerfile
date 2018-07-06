FROM node:8.11.3-alpine

ENV NODE_ENV production

RUN apk add --no-cache su-exec

ADD . /quinoa-server
WORKDIR /quinoa-server

RUN apk add --no-cache --virtual .build-deps make gcc g++ libc-dev libpng-dev automake autoconf libtool python \
    &&  npm install --quiet --production false \ 
    &&  apk del .build-deps \
    &&  rm -fr /root/.npm /root/.node-gyp

ENTRYPOINT ["su-exec", "node:node"]
CMD ["/usr/local/bin/npm", "start"]
