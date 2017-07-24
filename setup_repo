#! /usr/bin/env bash
github="https://github.com/CoderDojo/"
folder="./workspace-zen"
cd $folder || (echo "Couldn't access $folder" && exit)
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
  git clone "$github""$repo".git
done
