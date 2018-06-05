FROM node:8.4.0-alpine

ENV NODE_ENV production

RUN apk add --no-cache su-exec

RUN apk add --no-cache python build-base # build base includes g++ and gcc and Make for node-gyp dep

RUN mkdir -p /quinoa-server

ADD ./package.json /quinoa-server/

RUN cd /quinoa-server/ && npm --quiet install --production false

ADD . /quinoa-server

WORKDIR /quinoa-server

EXPOSE 3001

ENTRYPOINT ["su-exec", "node:node"]

CMD ["npm", "start"]