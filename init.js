'use strict';
const util = require('util');
const debug = require('debug')('localdev:init');
const async = require('async');
const mkdirp = require('mkdirp');
const command = require('./command.js');
const fs = require('fs');

module.exports = ({ _ }, systems, cb) => {
  debug(system);

  const usage = 'Usage: init <system-name>\n e.g. init zen';
  const sysName = _[1];
  if (!sysName) return cb(usage);
  if (!systems[sysName]) return cb(`System not found: ${sysName}`);

  const system = systems[sysName];
  const workspace = `workspace-${sysName}`;
  console.log('System:', sysName, util.inspect(system.stringify(), true, null), `workspace: ${workspace}`);

  // do all the setup
  async.series([createWorkspace, initRepos, npmInstalls, createDatabases], cb);

  function createWorkspace(cb) {
    mkdirp(workspace, cb);
  }

  function initRepos(cb) {
    async.mapSeries(system.services, initRepo, cb);
  }

  function npmInstalls(cb) {
    async.mapSeries(system.services, npmInstall, cb);
  }

  function initRepo(service, cb) {
    fs.exists(`${workspace}/${service.name}`, exists => {
      if (exists === true) return cb();
      async.series(
        [
          cb => {
            cloneRepo(service, cb);
          },
          cb => {
            checkoutBranch(service, cb);
          },
        ],
        cb
      );
    });
  }

  function cloneRepo({ repo, name, env }, cb) {
    const cmd = `git clone ${repo} ${name}`;
    debug('cloneRepo', workspace, cmd);
    command(cmd, workspace, env, cb);
  }

  function checkoutBranch({ branch, name, env }, cb) {
    const cmd = `git checkout ${branch}`;
    const dir = `${workspace}/${name}`;
    debug('checkoutBranch', dir, cmd);
    command(cmd, dir, env, cb);
  }

  function npmInstall({ name, env }, cb) {
    const dir = `${workspace}/${name}`;
    const cmd = 'npm install .';
    debug('npmInstall', dir, cmd);
    command(cmd, dir, env, cb);
  }

  function createDatabases(cb) {
    const pg = require('pg');
    const conString = util.format('postgres://%s:%s@%s/postgres', system.env.POSTGRES_USERNAME, system.env.POSTGRES_PASSWORD, system.env.POSTGRES_HOST);

    const client = new pg.Client(conString);
    client.connect(err => {
      if (err) return cb(`Postgres connection error: ${err}`);

      async.map(system.services, createDatabase, err => {
        client.end();
        cb(err);
      });

      function createDatabase({ database }, cb) {
        if (!database) return cb();

        const q = `CREATE DATABASE "${database}"`;
        client.query(q, err => {
          if (err) {
            // TODO - cheap and cheerful - do this instead:
            // SELECT datname FROM pg_catalog.pg_database WHERE lower(datname) = lower('dbname');
            if (err.toString().indexOf('already exists') === -1) {
              return cb(`Error creating database: ${err}`);
            }
          }
          return cb();
        });
      }
    });
  }
};
