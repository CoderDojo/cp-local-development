#! /usr/bin/env bash
folder="./workspace-zen"
docker-compose pull
declare -a repos=("cp-badges-service"
                  "cp-dojos-service"
                  "cp-eventbrite-service"
                  "cp-events-service"
                  "cp-organisations-service"
                  "cp-translations"
                  "cp-users-service"
                  "cp-zen-frontend"
                  "cp-zen-platform")
for repo in "${repos[@]}"; do
  cd $folder/"$repo" || (echo "Couldn't access $folder/$repo" && exit)
  git checkout staging
  git fetch origin
  git stash
  git reset --hard origin/staging
  cd ../.. || exit
done
