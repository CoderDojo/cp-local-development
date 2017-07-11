# Community Platform (Zen) Local Development

Instructions for setting up local development for the CoderDojo Community. There are four main parts to setting up your local development environment:

* Install the tools (docker, docker-compose, etc)
* Setting up the Community Platform code
* Loading test data into your fresh setup
* Making code changes

### Not what you were looking for?

Please visit [the our documentation repository](https://github.com/CoderDojo/community-platform/blob/master/README.md)
for more information about the project. We log [issues in the documentation repository here](https://github.com/CoderDojo/community-platform/issues).

## Install Tools

To develop for Zen you need the following tools installed:

- [Docker](https://docs.docker.com/engine/installation/) Docker engine version 1.13.0 - Zen's
development environment run completely in docker giving each mircoservice its own container
- [Docker-compose](https://docs.docker.com/compose/install/) version 1.10.0 or higher - this is used
to start the containers and set the env variables
- You also need to have [Git](https://git-scm.com/) installed in order to get the Community Platform
code from [GitHub](https://github.com/coderdojo).

## Code Setup

Next step is to get the Community Platform code cloned and up and running. To do that you clone this
repo and each micro service:

On Linux or mac run:

```
$ git clone https://github.com/CoderDojo/cp-local-development.git && cd cp-local-development
$ ./init
```

On Windows run:

```
$ git clone https://github.com/CoderDojo/cp-local-development.git && cd cp-local-development
$ git clone https://github.com/CoderDojo/cp-zen-platform.git workspace-zen/cp-zen-platform
$ git clone https://github.com/CoderDojo/cp-zen-frontend.git workspace-zen/cp-zen-frontend
$ git clone https://github.com/CoderDojo/cp-events-service.git workspace-zen/cp-events-service
$ git clone https://github.com/CoderDojo/cp-dojos-service.git workspace-zen/cp-dojos-service
$ git clone https://github.com/CoderDojo/cp-users-service.git workspace-zen/cp-users-service
$ git clone https://github.com/CoderDojo/cp-badges-service.git workspace-zen/cp-badges-service
$ git clone https://github.com/CoderDojo/cp-translations-tests workspace-zen/cp-translations
```

You may have permission errors on Windows in which case you need to change owner ship to yourself.

#### Docker-compose

To first set up the local development environment run from the cp-local-development folder:
```
$ docker-compose up localdev
```
This will build the containers and add the test data. To start zen from then on
you just have to run
```
docker-compose up zen
```
To restart a container run
```
docker-compose restart $service
```
To Stop the containers just run.
```
docker-compose stop
```

Note that you can also run services individually if you wish, e.g. `docker-compose up dojos`
Once docker looks to be running all the services ok (you'll see a lot of stack traces in the output if they are not running ok!) you should be able to hit [`localhost:8000`](http://localhost:8000) in your browser. If this is your first time running, you should see the world map but with no dojo markers, these will appear when we install some test data.

Note that the Forums and [Badges](installing-badgekit.md) will not be operable in local development mode, to run these, you need to install both [NodeBB](https://nodebb.org) and [BadgeKit](installing-badgekit.md) locally.

## Test Data

To reload the test data just run `docker-compose down -v && docker-compose up localdev`. This will delete the current
database and reload all testdata.
When all the test data is loaded, you should see Dojos appearing when you refresh your home page.
The different users you can login with are listed in [this file](https://github.com/CoderDojo/cp-users-service/blob/master/test/fixtures/e2e/README.md)

## End to End Tests

You can run the e2e tests by running `docker-compose run --rm test`
It means, it'll wipe your test database and start the e2e tests.

## Making code changes and working locally

When you initialise a system, it creates a `workspace-<systemName>` folder for each system, e.g. `workspace-zen`. If you open this directory in your code editor you will see all the code repositories that make up this system, e.g. cp-zen-platform, cp-dojos-service, cp-users-service, cp-countries-service, etc. When you first set it up, the `init` command will checkout the default branch for that system, e.g. `my-zen-branch` for each service. From then on, it's up to you to manage the contents of this directory, e.g. creating branches, changing branches, etc. The `run` command will simply run whatever is in those directories, it doesn't care about what branch they're on, etc.

### Creating your own forks

- Please note that you will need to fork each of the repositories manually so that you can put in a pull request. I.e. you will need to have your own version of each repo e.g. tangentfairy/cp-zen-platform so that you can put a pull request into the parent repository at CoderDojo/cp-zen-platform. [Read more about forks here](https://help.github.com/articles/fork-a-repo/).
- You will need to fork:
 - [cp-zen-platform](https://github.com/CoderDojo/cp-zen-platform) - frontend repo
 - [cp-dojos-service](https://github.com/CoderDojo/cp-dojos-service) - backend repo - service for Dojos
 - [cp-events-service](https://github.com/CoderDojo/cp-events-service) - backend repo - service for events
 - [cp-users-service](https://github.com/CoderDojo/cp-users-service) - backend repo - service for users

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
$ # make changes to code in your editor of choice. Any time code changes in a service the `run` command will automatically reload the service
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

## The `localdev` tool

This tool is designed to make it as easy as possible to on-board new developers to the Community Platform. It is also designed to be cross platform, so developers can contribute to the community on their OS of choice, e.g. Windows, Mac & Linux.

The [system.js](system.js) file is a mixture of code and data, and it's where the 'systems' are defined (just 'zen' now). At its core, each System contains a set of Services, and each service has its own code repository on github. When each command starts, it prints out the full information of the system it's using, e.g.

```
zen: {
  services: [{
    name: 'cp-salesforce-service',
    test: {
      name: 'test-dojo-data',
      port: 11301,
      host: process.env.CD_DOJOS || 'localhost',
    },
...
```

### Environment values

`localdev` has four places where environment variables can be set:

* env vars that are global to all systems, these are read first
* env vars that are system specific, these are read next
* env vars that are service specific, these are read next
* local setup specific variables, these are read last

Settings at any level will override existing settings, so for example anything you set in your local setup will override any previous setting.

See [system.js](system.js) for global, system and service environment variables.

To set local environment variables, set them in the `docker-compose.yml`:

### Testing

To create a clean test database add the env variable `ZENTEST=true` to the testdata container before
running `docker-compose up testdata`

### Debug

`localdev` uses the [Debug](http://npm.im/debug) module, to get extra debug information, run commands prefixed with 'DEBUG=localdev:* ..', e.g.

```
DEBUG=localdev:* ./localdev.js run zen
```

# Troubleshooting

Still having issues? Check out our [troubleshooting](troubleshooting.md) doc.
