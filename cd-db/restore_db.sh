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
    if [ "$repo" == dojos ]; then
      echo creating dojos restore list file
      pg_restore --list /db/dojos/backup_dump -f /db/dojos.list

      echo removing nearest_dojos index from dojos restore list
      sed -i -e '/nearest_dojos/d' /db/dojos.list

      echo restoring using list file
      pg_restore -c --if-exists -w -d "cp-${repo}-development" -U platform -L /db/dojos.list /db/"$repo"/backup_dump
    else
      echo restoring "$DUMP" with pg_restore
      pg_restore -c --if-exists -w -d "cp-${repo}-development" -U platform /db/"$repo"/backup_dump
    fi
  fi
}

restore users
restore dojos
restore events
