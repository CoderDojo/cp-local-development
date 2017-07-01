FROM coderdojo/cp-dojos-service:latest
ADD ./workspace-zen/cp-translations /usr/src
WORKDIR /usr/src/cp-translations
RUN npm link
WORKDIR  /usr/src/app
RUN npm link cp-translations && npm install -g nodemon
VOLUME /usr/src/app /usr/src/cp-translations
CMD ["npm", "install" "&&" "nodemon", "service.js"]
