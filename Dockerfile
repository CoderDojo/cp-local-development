FROM node:alpine
MAINTAINER butlerx <butlerx@notthe.cloud>

RUN apk add --update git build-base python postgresql-client &&\
    mkdir -p /usr/src/app
WORKDIR /usr/src/app
ADD testdata.js system.js package.json localdev.js /usr/src/app/
RUN yarn && \
    apk del build-base python && \
    rm -rf /tmp/* /root/.npm /root/.node-gyp
EXPOSE 11500
ENTRYPOINT ["node", "localdev.js"]
