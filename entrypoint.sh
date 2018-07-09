#!/bin/sh

chown -R node:node /quinoa-server/data

su-exec node:node /usr/local/bin/npm start
