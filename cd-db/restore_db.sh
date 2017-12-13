#!/usr/bin/env sh

set -e

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
