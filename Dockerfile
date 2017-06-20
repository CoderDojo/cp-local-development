FROM node:boron-alpine
MAINTAINER butlerx <butlerx@notthe.cloud>

RUN apk add --update build-base python postgresql-client &&\
    mkdir -p /usr/src/app
WORKDIR /usr/src/app
ADD . /usr/src/app/
RUN yarn && \
    node localdev.js init zen && \
    apk del build-base python && \
    rm -rf /tmp/* /root/.npm /root/.node-gyp
CMD node localdev.js testdata zen
