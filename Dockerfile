FROM node:8-alpine
MAINTAINER butlerx <butlerx@notthe.cloud>
RUN apk add --update git build-base python postgresql &&\
    mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY docker-entrypoint.sh yarn.lock index.js package.json /usr/src/app/
COPY lib /usr/src/app/lib
COPY data /usr/src/app/data
RUN yarn && \
    apk del build-base python && \
    rm -rf /tmp/* /root/.npm /root/.node-gyp
ENTRYPOINT ["/usr/src/app/docker-entrypoint.sh"]
