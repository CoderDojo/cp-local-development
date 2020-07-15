#! /usr/bin/env bash

CWD=`pwd`
DIRECTORY="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

cd $DIRECTORY

function log() {
  if [[ -n $1 ]];then
    printf "\033[0;36m\n$1\n\033[0m"
  fi
}

function quit() {
  if [[ -n $1 ]];then
    printf "\033[0;31m\n\n$1\n\n\033[0m"
  fi
  cd $CWD
  exit
}

function repo_checkout_master() {
  if [[ -n $1 ]];then
    log "checking out master for '$1'"
    cd $DIRECTORY
    cd "workspace-zen/$1/"
    DIRTY=`git status --porcelain`

    if [[ -n $DIRTY ]]; then
      quit "$1 has unstaged / uncommitted changes, please fix and try again"
    fi
  fi
}

# Update the translations repo if we are able
repo_checkout_master 'cp-translations'

TRANSLATIONS_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[ ",^]//g')

log "cp-translations is version $TRANSLATIONS_VERSION"

REPOS=("cp-events-service" "cp-dojos-service" "cp-users-service" "cp-zen-frontend")

for repo in ${REPOS[@]}; do
  printf "\033[0;33m\n\nUpdating $repo\n\033[0m"

  repo_checkout_master $repo

  PACKAGE_VERSION=$(cat package.json \
    | grep cp-translations \
    | head -1 \
    | awk -F: '{ print $2 }' \
    | sed 's/[ ",^]//g')

  log "$repo uses version $PACKAGE_VERSION"

  #if it doesn't match, we need to create a branch, update version, commit and push 
  if [[ "$TRANSLATIONS_VERSION" != "$PACKAGE_VERSION" ]]; then
    log "Updating cp-translations for cp-events-service"
    escaped_lhs=$(printf '%s\n' "\"cp-translations\": \"^$PACKAGE_VERSION\"" | sed 's:[][\\/.^$*]:\\&:g')
    escaped_rhs=$(printf '%s\n' "\"cp-translations\": \"^$TRANSLATIONS_VERSION\"" | sed 's:[\\/&]:\\&:g;$!s/$/\\/')

    sed -i '' -e "s/$escaped_lhs/$escaped_rhs/g" package.json

    BRANCH="update-translations-$TRANSLATIONS_VERSION"
    git add package.json
    git checkout -b $BRANCH
    git commit -m "Update cp-translations to $TRANSLATIONS_VERSION"
    git push -u origin $BRANCH
    git checkout master
    # git push origin --delete $BRANCH
    # git branch -D $BRANCH
  fi
done

log "Finished"
exit
