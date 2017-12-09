#! /usr/bin/env sh

until pg_isready -h db; do
  echo "."
  sleep 2
done
node .
