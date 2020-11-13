# Community Platform (Zen) Local Development

Instructions for setting up local development for the CoderDojo Community.
There are four main parts to setting up your local development environment:

* Install the tools (docker, docker-compose, etc)
* Setting up the Community Platform code
* Loading test data into your fresh setup
* Making code changes

### Not what you were looking for?

Please visit [the our documentation repository](https://github.com/CoderDojo/community-platform/blob/master/README.md)
for more information about the project.
We log [issues in the documentation repository here](https://github.com/CoderDojo/community-platform/issues).

## Install Tools

To develop for Zen you need the following tools installed:

* [Docker](https://docs.docker.com/engine/installation/) Docker engine version
  1.13.0 - Zen's development environment run completely in docker giving each
  mircoservice its own container
* [Docker-compose](https://docs.docker.com/compose/install/) version 1.10.0 or
  higher - this is used to start the containers and set the env variables
* You also need to have [Git](https://git-scm.com/) installed in order to get
  the Community Platform code from [GitHub](https://github.com/coderdojo).

## Code Setup

Next step is to get the Community Platform code cloned and up and running. To
do that you clone this repo and each micro service:

Run:

```
git clone https://github.com/CoderDojo/cp-local-development.git && cd cp-local-development
# this will clone all the microservices
./setup_repo.sh
# this will install the dependencies of all microservices
./install_deps.sh
```

The dependency script runs all of the installations in parallel which may have issues on some machines / networks.  For a slower, but steadier way, use the following:

```
./install_deps.sh --series
```

You may have permission errors on Windows in which case you need to change
ownership to yourself.

### Docker-compose

To first set up the local development environment run, from the
cp-local-development folder, `docker-compose up zen`.
To start zen from then on you just have to run

```
docker-compose up zen
```

To restart a container run

```
docker-compose restart $service
```

To stop the containers run.

```
docker-compose stop
```

Note that you can also run services individually if you wish,
e.g. `docker-compose up dojos`. Once docker looks to be running all the
services ok (you'll see a lot of stack traces in the output if they are not
running ok!) you should be able to hit [`localhost:8000`](http://localhost:8000)
in your browser. If this is your first time running, you should see the "Find
a Dojo to attend" Page this page wont return any dojos until you've created one

Note that the Forums and [Badges](installing-badgekit.md) will not be operable
in local development mode, to run these, you need to install both
[NodeBB](https://nodebb.org) and [BadgeKit](installing-badgekit.md) locally, which are a different problem.

## Making code changes and working locally

### Creating your own forks

* Please note that you will need to fork each of the repositories manually so
  that you can put in a pull request. I.e. you will need to have your own
  version of each repo e.g. tangentfairy/cp-zen-platform so that you can put a
  pull request into the parent repository at CoderDojo/cp-zen-platform.
  [Read more about forks here](https://help.github.com/articles/fork-a-repo/).
* You will need to fork:
  * [cp-zen-platform](https://github.com/CoderDojo/cp-zen-platform) (legacy
    frontend and) api repo
  * [cp-zen-frontend](https://github.com/CoderDojo/cp-zen-frontend) frontend repo
  * [cp-dojos-service](https://github.com/CoderDojo/cp-dojos-service) legacy backend repo,
    service for Dojos
  * [cp-events-service](https://github.com/CoderDojo/cp-events-service) legacy backend
    repo, service for events
  * [cp-users-service](https://github.com/CoderDojo/cp-users-service) legacy backend repo,
    service for users
  * [cp-eventbrite-service](https://github.com/CoderDojo/cp-eventbrite-service)
    backend service for eventbrite integration
  * [cp-organisations-service](https://github.com/CoderDojo/cp-organisations-service)
    backend service for user groups
  * [cp-email-service](https://github.com/CoderDojo/cp-email-service)
    backend service for mailing
  * [events-service](https://github.com/CoderDojo/events-service)
    backend service for events
  * [users-service](https://github.com/CoderDojo/users-service)
    backend service for users
  * [clubs-service](https://github.com/CoderDojo/clubs-service)
    backend service for clubs

You can read more about the repositories and system architecture [in this document](https://github.com/CoderDojo/community-platform/blob/master/architecture.md).

Once forked, link your newly forked repository to the original one:

```
$ # add the forked repository as local
$ # git remote add local https://github.com/<your-username>/<repository-name>

$ # As an example, if you have forked cp-zen-platform and your github username is JaneDoe
$ git remote add local https://github.com/JaneDoe/cp-zen-platform

```

### Development workflow

Then, a typical development workflow would be:

```
$ cd ./workspace-zen/cp-zen-platform
$ git checkout -b my-new-branch
$ # make changes to code in your editor of choice.
$ git push -u local my-new-branch
$ # to pull request, code review, merge, etc on github
```

To update your forked repository:

```
$ # grab latest code changes from the common repository
$ git fetch origin

$ # then integrate them with your local codebase (like "git pull" which is fetch + merge)
$ git merge origin/master master

$ # or, better, replay your local work on top of the fetched branch
$ # like a "git pull --rebase"
$ git rebase origin/master
```

## Debug

Most of the new services are exposing an interface to the node debugger, which are described by the following:
```
  ports:
   - 92xx:9229
```
The ports are incremental and in the 9200-9300 range.
To open the debugger, open chrome with chrome://inspect.

## Troubleshooting

### SELinux

If you are using a distribution of the Linux kernel that implements SELinux you may have permissions
issues with volumes disappearing. This is due to having not set SELinux Policies. A quick workaround
to not setting all the required policies is to run. `su -c "setenforce 0"` before runing any docker
command.

### Still having issues?

Check out our [troubleshooting](troubleshooting.md) doc.

## Deployment

In order to get your changes deployed there might be several merges/upgrades to sort out.  For example, if you update a banner, requiring changes in `cp-translations`, `cp-zen-frontend`, and `cp-zen-platform`, you need to:

1. Merge `cp-translations` changes, wait for the CI to rebuild and publish a new npm package. Re-pull your master branch to get the auto-incremented version.
2. Update the version of `cp-translations` in packages.json for `cp-zen-frontend`, and re-install yarn dependencies, and get them merged to master. Wait for the CI to rebuild and publish a new npm package.   Re-pull your master branch to get the auto-incremented version number.
3. Finally update the version of both `cp-zen-frontend` and `cp-translations` in `cp-zen-platform`, re-install yarn dependencies, and then get those changes merged to master.

This is because both `cp-zen-frontent` and `cp-zen-platform` independently depend on `cp-translations`, and then `cp-zen-platform` also depends on `cp-zen-frontend`.

You might find other dependency chains that are similar, so be aware that you might have to merge before updating dependent repos.

