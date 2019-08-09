FROM node:10.15.3-alpine

ENV NODE_ENV production
ENV NGINX_STATIC true

RUN apk add --no-cache su-exec

ADD . /quinoa-server
WORKDIR /quinoa-server

RUN apk add --no-cache --virtual .build-deps make gcc g++ libc-dev libpng-dev automake autoconf libtool python \
    &&  npm ci --quiet --production false --no-audit \
    &&  apk del .build-deps \
    &&  rm -fr /root/.npm /root/.node-gyp \
    &&  npm run dist

RUN mkdir -p /quinoa-server/data

VOLUME /quinoa-server/data

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
