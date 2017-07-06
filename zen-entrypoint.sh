#! /usr/bin/env sh
cd /usr/src/cp-translations || exit
npm link
cd /usr/src/app || exit
npm install && npm link cp-translations && \
node_modules/.bin/bower install --allow-root && \
npm run lint-lib && \
npm run gulp && \
nodemon service.js
