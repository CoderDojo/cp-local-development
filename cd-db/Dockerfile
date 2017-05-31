FROM postgres:alpine
MAINTAINER butlerx <butlerx@notthe.cloud>

ENV DB_USER=platform
ENV DB_PASS=QdYx3D5y
ENV DB_NAME=platform
COPY ./create_user.sh   /docker-entrypoint-initdb.d/10-create_user.sh
COPY ./create_db.sh     /docker-entrypoint-initdb.d/20-create_db.sh
