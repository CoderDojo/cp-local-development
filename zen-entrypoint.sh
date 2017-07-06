#! /usr/bin/env sh
cd /usr/src/cp-translations || exit
npm link
cd /usr/src/cp-zen-frontend || exit
npm install && \
npm link && \
npm run dev &
cd /usr/src/app || exit
npm install && \
npm link cp-translations && \
npm link cp-zen-frontend && \
node_modules/.bin/bower install --allow-root && \
npm run gulp && \
nodemon service.js
