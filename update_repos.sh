#! /usr/bin/env bash
folder="./workspace-zen"
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
  git pull
  cd ../.. || exit
done
