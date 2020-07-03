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
    if [ "$repo" == dojos ]; then
      # dojos may fail when creating the index for nearest_dojos on backups from Posgres 9.4
      echo creating dojos restore list file
      pg_restore --list /db/dojos/backup_dump -f /db/dojos.list

      echo removing nearest_dojos index from dojos restore list
      sed -i -e '/nearest_dojos/d' /db/dojos.list

      echo restoring using list file
      pg_restore -c --if-exists -w -d "cp-${repo}-development" -U platform -L /db/dojos.list /db/"$repo"/backup_dump
    else
      echo restoring "$repo" with pg_restore
      pg_restore -c --if-exists -w -d "cp-${repo}-development" -U platform /db/"$repo"/backup_dump
    fi
  fi
}

restore users
restore events
restore dojos
