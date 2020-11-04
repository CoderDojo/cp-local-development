#! /usr/bin/env bash

set -e

if [[ "$1" == "--series" ]];
then
  containers=("zen" "frontend" "badges" "dojos" "events"
    "eventbrite" "organisations" "users" "events_service"
    "users_service" "clubs_service" "email_service")
  
  for container in ${containers[@]};
  do
    docker-compose -f docker-compose.yarn.yml run yarn_${container}
  done
else
  docker-compose -f docker-compose.yarn.yml up
  docker-compose -f docker-compose.yarn.yml down
fi
