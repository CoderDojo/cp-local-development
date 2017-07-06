FROM coderdojo/cp-dojos-service:latest
RUN apk add --update git python build-base && \
    npm install -g nodemon
ADD docker-entrypoint.sh /usr/src
VOLUME /usr/src/app /usr/src/cp-translations
CMD ["/usr/src/docker-entrypoint.sh"]
