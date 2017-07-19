#!/bin/bash
set -e

POSTGRES="psql --username ${POSTGRES_USER}"

$POSTGRES <<-EOSQL
create user platform with superuser password 'QdYx3D5y';
CREATE DATABASE "cp-dojos-development" OWNER platform;
CREATE DATABASE "cp-users-development" OWNER platform;
CREATE DATABASE "cp-events-development" OWNER platform;
EOSQL
