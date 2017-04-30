# Community Platform (Zen) Local Development

Instructions for setting up local development for the CoderDojo Community on Mac and Linux. There are four main parts to setting up your local development environment:

* Install the tools (node.js, PostgreSQL, etc)
* Setting up the Community Platform code
* Loading test data into your fresh setup
* Making code changes

###Not what you were looking for?
Please visit [the our documentation repository](https://github.com/CoderDojo/community-platform/blob/master/README.md) for more information about the project. We log [issues in the documentation repository here](https://github.com/CoderDojo/community-platform/issues).


## Install Tools

To develop for Zen you need the following tools installed:

* [Node.js](http://nodejs.org) version 0.10.38 or 5.7.0 - ideally installed with [nvm](https://github.com/creationix/nvm) as described in this [article](http://www.nearform.com/nodecrunch/nodejs-sudo-free/). Note that **only** node 0.10.x or 5.x is supported currently. In order to run the e2e test and until we can drop support of node 0.10, define your node v4+ to the alias "cp-e2e" by running `nvm alias cp-e2e v5.7.0`.

* [Npm](https://www.npmjs.com/get-npm) version 2.x minimum required. Run `npm -g install npm@latest-2` to install the latest version of npm of the branch 2.x.

* [PostgreSQL](http://www.postgresql.org/) version 9.4 - see [here](https://wiki.postgresql.org/wiki/Detailed_installation_guides) for installation instructions for your platform. You also may want to install the [pgAdmin](http://www.pgadmin.org/).
  * _N.B._ When you install PostGres make sure that you set a password for the "postgres" user and keep a note of it, or you may run into issues.

* When PostgreSQL is installed, you need to create a new user (you can do this from pgAdmin 'Login Roles' in the tree):
  * username: platform
  * password: QdYx3D5y

Give the new `platform` user all the admin privileges, i.e. make them a super user.

You can create the `platform` user from the postgresql shell using:

```
postgres=# create user platform with superuser password 'QdYx3D5y';
```

* You also need to have [Git](https://git-scm.com/) installed in order to get the Community Platform code from [GitHub](https://github.com/coderdojo).

### Mac Users
To compile native modules you'll need to install xcode from the Mac App Store.

### Docker
If you have issues setting up, we do have a Docker setup [here](https://hub.docker.com/r/josmas/coderdojo-local-zen/) and [here](https://hub.docker.com/r/butlerx/coderdojo-local-zen/) that might be more useful
- [josmas](https://hub.docker.com/r/josmas/coderdojo-local-zen/) container is designed for local development
- [butlerx](https://hub.docker.com/r/butlerx/coderdojo-local-zen/) container is designed for testing and auto starts the services and runs e2e tests

## Code Setup

Next step is to get the Community Platform code cloned and up and running. To do that you clone this repo and use the `localdev` command to both setup and run the code:

```
$ git clone https://github.com/CoderDojo/cp-local-development.git && cd cp-local-development
$ nvm use
$ npm install
```

Then run `node ./localdev.js` to make sure the `localdev` tool can run ok. You should see output similar to the following:

```
Usage "./localdev.js <command>" where command is one of:
  "init zen": does a fresh setup of your local dev environment
  "run zen": runs all the services in your system
  "testdata zen": loads test data for each service
  "test zen": run the e2e tests
```

The `localdev` tool has one system configured, called `zen` (this can be extended to use multiple systems, but for now, 'zen' is the only one).

### localdev init

*Note: By default `init` will clone the repositories directly from the CoderDojo Foundation account. If you prefer to clone your own repos, please have a look at how to work with [your own forks](#creating-your-own-forks).*

Next, run `./localdev.js init zen`. Behind the scenes this does the following:

* creates a `workspace-zen` directory
* install each service defined in the system, see [system.js](system.js)
* each service is cloned from github
* the `master` branch is checked out
* an npm install is done in each repo
* connects to your local PostgreSQL and creates any databases necessary

Note that the `init` command is idempotent, you can run it multiple times with no adverse side effects. Depending on your machine, the first initialisation can take in the order of 10 to 20 minutes to complete.

### localdev run

Next, run `./localdev.js run zen`. Behind the scenes (see [run.js](run.js)) this does the following:

* sets up 'watchers' for each service in the system
* runs each service

The output from each service is displayed in the `run` shell. Note that this is not a daemon process, the `run` command will not exit until you hit ctrl-c. The 'watchers' detect any changes to code files in any of the service code repos, if a file is changed the service is restarted automatically. This allows for really quick development.

Note that you can also run services individually if you wish, e.g. `./localdev.js run zen cp-zen-platform`.

Once `run` looks to be running all the services ok (you'll see a lot of stack traces in the output if they are not running ok!) you should be able to hit [`localhost:8000`](http://localhost:8000) in your browser. If this is your first time running, you should see the world map but with no dojo markers, these will appear when we install some test data.

By default, `./localdev.js run zen` will have UI debugging enabled. This means when you load [`localhost:8000`](http://localhost:8000) in your browser, it will use the source files to run Zen. To build and run with the built code, you need to turn off UI debugging, by running `./localdev.js run zen --uidebug=false`.

By default, `./localdev.js run zen` will run upon cp-{entity}-development databases, entity being "dojos", "users" and "events".
By running `./localdev.js run zen --zentest=true`, you will start the stack on cp-{entity}-test databases created for e2e tests, which allows you to navigate through what the e2e tests use.

Since migrations for each µs is ran when starting them, you can reset the databases by using the `--reset=true` parameter. This can also be used on first run to create the databases.

Note that the Forums and [Badges](installing-badgekit.md) will not be operable in local development mode, to run these, you need to install both [NodeBB](https://nodebb.org) and [BadgeKit](installing-badgekit.md) locally.

## Test Data

Next, in another shell (the system has to be running before you load the test data), run `./localdev.js testdata zen`. Behind the scenes, each service has a mechanism for loading test data into its database, and this command simply tells each service to load its test data.

Note that this command will fail if run more than once.

When all the test data is loaded, you should see Dojos appearing when you refresh your home page. The different users you can login with are listed in [this file](https://github.com/CoderDojo/cp-users-service/blob/master/test/fixtures/e2e/README.md)

By default, `./localdev.js testdata zen` will run upon cp-{entity}-development databases. By running `./localdev.js testdata zen --zentest=true`, you will load e2e tests data into cp-{entity}-tests, which is useful to test your data loading process.

## End to End Tests
You can run the e2e tests by running `./localdev.js test zen`.
Under the hood, it simply spin up `./localdev.js run zen --zentest=true` and `./localdev testdata zen --zentest=true` as well as `npm test` from cp-e2e.
It means, it'll wipe your test database and start the e2e tests.
As well as the others command, you can specify `--zentest=false` if you want to run the tests upon the default databases, cp-{entity}-development.

## Making code changes and working locally

When you initialise a system, it creates a `workspace-<systemName>` folder for each system, e.g. `workspace-zen`. If you open this directory in your code editor you will see all the code repositories that make up this system, e.g. cp-zen-platform, cp-dojos-service, cp-users-service, cp-countries-service, etc. When you first set it up, the `init` command will checkout the default branch for that system, e.g. `my-zen-branch` for each service. From then on, it's up to you to manage the contents of this directory, e.g. creating branches, changing branches, etc. The `run` command will simply run whatever is in those directories, it doesn't care about what branch they're on, etc.

### Creating your own forks
* Please note that you will need to fork each of the repositories manually so that you can put in a pull request. I.e. you will need to have your own version of each repo e.g. tangentfairy/cp-zen-platform so that you can put a pull request into the parent repository at CoderDojo/cp-zen-platform. [Read more about forks here](https://help.github.com/articles/fork-a-repo/).
* You will need to fork:
 * [cp-zen-platform](https://github.com/CoderDojo/cp-zen-platform) - frontend repo
 * [cp-dojos-service](https://github.com/CoderDojo/cp-dojos-service) - backend repo - service for Dojos
 * [cp-events-service](https://github.com/CoderDojo/cp-events-service) - backend repo - service for events
 * [cp-users-service](https://github.com/CoderDojo/cp-users-service) - backend repo - service for users
* Update the `baseRepo` variable [in system.js here](https://github.com/CoderDojo/cp-local-development/blob/master/system.js#L1) to point at your Github username instead of /CoderDojo

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
  systemBranch: 'master',
  services: [{
    name: 'cp-dojos-service',
    repo: 'git@github.com:CoderDojo/cp-dojos-service',
    branch: 'master',
    start: './start.sh empty service.js',
    env: {
      POSTGRES_USERNAME: 'platform',
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

To set local environment variables, do the following:

* create a file called `local-dev.js`. Note this file is in the `.gitignore` so it won't be added to git
* override any variables you want as follows:

```
module.exports = {
  POSTGRES_HOST: '192.168.59.103',
  SALESFORCE_ENABLED: 'false'
}
```

### Debug

`localdev` uses the [Debug](http://npm.im/debug) module, to get extra debug information, run commands prefixed with 'DEBUG=localdev:* ..', e.g.

```
DEBUG=localdev:* ./localdev.js run zen
```

### Windows

Support for developing the platform on Windows is currently work in progress, and we would welcome contributions here.

In addition to the tools mentioned above, (Git, Node, PostgreSql, etc), on Windows, you need to install additional tools:

* [Microsoft Visual Studio 2015](https://www.visualstudio.com/en-us/downloads/download-visual-studio-vs.aspx)
* [Python 2.7](https://www.python.org/downloads)

Both of these are needed in order to compile native node.js modules (which are built in c++).

# Troubleshooting

Still having issues? Check out our [troubleshooting](troubleshooting.md) doc.
