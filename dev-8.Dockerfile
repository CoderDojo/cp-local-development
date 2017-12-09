FROM node:8-alpine
MAINTAINER butlerx <cian@coderdojo.com>
RUN apk add --update git build-base python postgresql-client && \
    mkdir -p /usr/src/app /usr/src/cp-translations /usr/src/cp-zen-frontend
ENV NODE_ENV development
WORKDIR /usr/src/app
