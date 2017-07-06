FROM coderdojo/cp-zen-platform:latest
RUN apk add --update git python build-base && \
    npm install -g nodemon
ADD zen-entrypoint.sh /usr/src
VOLUME /usr/src/app /usr/src/cp-translations
CMD ["/usr/src/zen-entrypoint.sh"]
