#!/bin/sh

# NOTE: tutorials will be re-created on startup even if users deleted them
# Do we really want that?
chown -R node:node /quinoa-server/data
su-exec node:node /usr/local/bin/npm run load:tutorials:docker

chown -R node:node /quinoa-server/data
su-exec node:node /usr/local/bin/npm run start:docker
