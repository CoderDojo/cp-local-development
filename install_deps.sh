#! /usr/bin/env bash

set -e

docker-compose -f docker-compose.yarn.yml up
docker-compose -f docker-compose.yarn.yml down
