#! /usr/bin/env bash

set -e

github="https://github.com/CoderDojo/"
folder="./workspace-zen"

cd $folder || (echo "Couldn't access $folder" && exit)
git clone "$github"cp-translations.git

declare -a node0=("badges"
  "dojos"
  "eventbrite"
  "events"
  "users")
declare -a zen=("frontend"
  "platform")
declare -a node8=("organisations")

for repo in "${node0[@]}"; do
  git clone "$github"cp-"$repo"-service.git
  docker-compose run --rm --no-deps "$repo" npm install
done

for repo in "${node8[@]}"; do
  git clone "$github"cp-"$repo"-service.git
  docker-compose run --rm --no-deps "$repo" yarn
done

for repo in "${zen[@]}"; do
  git clone "$github"cp-zen"$repo".git
done

docker-compose run --rm --no-deps frontend yarn
docker-compose run --rm --no-deps zen yarn
