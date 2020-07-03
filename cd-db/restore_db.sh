#!/usr/bin/env sh

set -e

# To restore the a database place an unzipped tar in the dump folder
# they should be called users.tar, dojos.tar and events.tar
# or untar a backup of each db into it's corresponding folder users, dojos or events
# Don't use a gzipped backup as tar will fail
# FYI Database dumps are stored in an S3 bucket called zen-pg-backup

restore() {
  repo=$1
  DUMP="/db/${repo}.tar"
  if [ -f "$DUMP" ]; then
    echo unpacking "$DUMP"
    mkdir -p /db/"$repo"
    tar xvf "$DUMP" -C /db/"$repo"
  fi
  DIR="/db/${repo}/backup_dump"
  if [ -d "$DIR" ]; then
    echo restoring "$repo"
    pg_restore -c --if-exists -w -d "cp-${repo}-development" -U platform /db/"$repo"/backup_dump
  fi
}

restore users
restore events
# dojos may fail when creating the index for nearest_dojos on backups from Posgres 9.4
# Restart the container and you can run it manually if needed
# `docker exec -it cp-local-development_db_1 bash`
# Start a psql console
# psql -U postgres
# Change to dojos DB
# \c cp-dojos-development
# Execute the SQL
# CREATE INDEX nearest_dojos ON public.cd_dojos USING gist (public.ll_to_earth((((geo_point -> 'lat'::text))::text)::double precision, (((geo_point -> 'lon'::text))::text)::double precision));
restore dojos
