#! /usr/bin/env bash

set -e

github="https://github.com/CoderDojo/"
folder="./workspace-zen"

cd $folder || (echo "Couldn't access $folder" && exit)
git clone "$github"cp-translations.git

declare -a services=("badges"
	"dojos"
	"eventbrite"
	"events"
	"organisations"
	"users")

for repo in "${services[@]}"; do
	git clone "$github"cp-"$repo"-service.git
	docker-compose run --rm --no-deps "$repo" yarn
done

git clone "$github"cp-zen-frontend.git
docker-compose run --rm --no-deps frontend yarn
git clone "$github"cp-zen-platform.git
docker-compose run --rm --no-deps zen yarn
