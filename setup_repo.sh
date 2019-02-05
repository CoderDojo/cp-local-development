#! /usr/bin/env bash

set -e

base_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
github="git@github.com:CoderDojo/"
# github="https://github.com/CoderDojo/"
workspace="workspace-zen"

cd "${base_dir}/${workspace}" || (echo "Couldn't access ${base_dir}/${workspace}" && exit)

declare -a legacy_services=("badges"
  "dojos"
  "eventbrite"
  "events"
  "organisations"
  "users")

for repo in "${legacy_services[@]}"; do
  if [ ! -d "${base_dir}/${workspace}/cp-${repo}-service" ]; then
    git clone "$github"cp-"$repo"-service.git
  fi
done

if [ ! -d "${base_dir}/${workspace}/cp-translations" ]; then
  git clone "$github"cp-translations.git
fi

if [ ! -d "${base_dir}/${workspace}/cp-zen-frontend" ]; then
  git clone "$github"cp-zen-frontend.git
fi

if [ ! -d "${base_dir}/${workspace}/cp-zen-platform" ]; then
  git clone "$github"cp-zen-platform.git
fi

declare -a services=("events"
  "clubs"
  "users"
  "cp-email")

mkdir -p "$base_dir/${workspace}/services"
cd "${base_dir}/${workspace}/services"

for repo in "${services[@]}"; do
  if [ ! -d "${base_dir}/${workspace}/services/${repo}-service" ]; then
    git clone "$github""$repo"-service.git
  fi
done
