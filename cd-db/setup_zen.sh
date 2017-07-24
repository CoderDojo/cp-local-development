#!/bin/bash
set -e

POSTGRES="psql --username ${POSTGRES_USER}"

$POSTGRES <<-EOSQL
create user platform with superuser password 'QdYx3D5y';
EOSQL
