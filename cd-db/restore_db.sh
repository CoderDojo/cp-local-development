#!/usr/bin/env sh

set -e

# To restore the a database place the tar.gz in the dump folder
# they should be called users.tar.gz, dojos.tar.gz and events.tar.gz

restore() {
  repo=$1
  DUMP="/db/${repo}.tar.gz"
  if [ -f "$DUMP" ]; then
    echo restoring "$DUMP"
    mkdir -p /db/"$repo"
    tar xvf "$DUMP" -C /db/"$repo"
    pg_restore -c --if-exists -w -d "cp-${repo}-development" -U platform /db/"$repo"/backup_dump
  fi
}

restore users
restore dojos
restore events
