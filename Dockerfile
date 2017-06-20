FROM node:boron-alpine
MAINTAINER butlerx <butlerx@notthe.cloud>

RUN apk add --update  git make gcc g++ python postgresql-client &&\
    mkdir -p /usr/src/app
WORKDIR /usr/src/app
ADD . /usr/src/app/
RUN yarn
WORKDIR /usr/src/app/workspace-zen/cp-dojos-service
RUN yarn
WORKDIR /usr/src/app/workspace-zen/cp-events-service
RUN yarn
WORKDIR /usr/src/app/workspace-zen/cp-users-service
WORKDIR /usr/src/app
RUN apk del make gcc g++ python && rm -rf /tmp/* /root/.npm /root/.node-gyp

CMD node localdev.js testdata zen
