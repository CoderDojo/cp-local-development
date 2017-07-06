#! /usr/bin/env sh
cd /usr/src/cp-translations || exit
npm link
cd /usr/src/app || exit
npm install && npm link cp-translations
nodemon service.js
