#!/bin/sh

chown -R node:node /quinoa-server/data

BABEL_DISABLE_CACHE=1 su-exec node:node /usr/local/bin/npm start
