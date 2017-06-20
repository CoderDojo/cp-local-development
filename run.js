'use strict';

const debug = require('debug')('localdev:setup');
const async = require('async');
const command = require('./command.js');
const _ = require('lodash');
const chokidar = require('chokidar');
const util = require('util');
const child_process = require('child_process');
const fs = require('fs');

module.exports = (argv, systems, cb) => {
  process.env.UIDEBUG = argv.uidebug || 'true'; // added as env var for use in services
  process.env.DEBUG = argv.debug === 'true'; // added as env var for use in services

  const usage = 'Usage: run <system-name>\n e.g. run phase1\n e.g. run phase3 cp-zen-platform';
  const sysName = argv._[1];
  if (!sysName) return cb(usage);
  const system = systems[sysName];
  if (!system) return cb(`System not found: ${sysName}`);
  debug(system);
  const reset = argv.reset || 'false';

  const workspace = `workspace-${sysName}`;
  console.log('System:', sysName, util.inspect(system.stringify(), true, null), `workspace: ${workspace}`);

  let procs = [];

  const serviceName = argv._[2];
  let services = system.services;
  if (serviceName) {
    const service = _.findWhere(system.services, { name: serviceName });
    if (!service) return cb(`Service not found: ${serviceName}`);
    services = [service];
  }

  // restart queue - ensures only one service restarted at a time
  const restartQ = async.queue((task, cb) => {
    const service = task.service;
    debug('restarting service', service);
    killService(service, err => {
      if (err) return cb(err);
      runService(service, cb);
    });
  }, 1);

  // run the services!
  async.series([resetDatabase, runServices, watchServices], cb);

  function resetDatabase(sCb) {
    if (reset === 'true') {
      const pg = require('pg');
      const conString = util.format('postgres://%s:%s@%s/postgres', system.env.POSTGRES_USERNAME, system.env.POSTGRES_PASSWORD, system.env.POSTGRES_HOST);

      const client = new pg.Client(conString);
      client.connect(err => {
        if (err) return cb(`Postgres connection error: ${err}`);
        async.map(system.services, createDatabase, err => {
          client.end();
          sCb(err);
        });

        function createDatabase({ database }, mCb) {
          if (!database) return mCb();
          const q = `DROP DATABASE IF EXISTS "${database}"`;
          client.query(q, err => {
            if (err) {
              return cb(`Error dropping database: ${err}`);
            }
            const q = `CREATE DATABASE "${database}"`;
            client.query(q, err => {
              if (err) {
                // TODO - cheap and cheerful - do this instead:
                // SELECT datname FROM pg_catalog.pg_database WHERE lower(datname) = lower('dbname');
                if (err.toString().indexOf('already exists') === -1) {
                  return cb(`Error creating database: ${err}`);
                }
              }
              return mCb();
            });
          });
        }
      });
    } else {
      sCb();
    }
  }

  function runServices(cb) {
    async.map(services, runService, cb);
  }

  function runService(service, cb) {
    function start() {
      const proc = command(cmd, dir, service.env, err => {
        if (err) console.error(`Error running service: ${err}`);
        else console.log(`Service terminated: ${service.name}`);
      });

      proc.serviceName = service.name;
      procs.push(proc);
      return cb();
    }
    if (!service.start) return cb();
    const dir = `${workspace}/${service.name}`;
    const cmd = service.start;
    debug('runService', dir, cmd);
    if (process.env.UIDEBUG === 'true') {
      try {
        const gulpFile = `./${workspace}/${service.name}/gulpfile.js`;
        if (fs.existsSync(gulpFile)) {
          const watcher = child_process.spawn('npm', ['run', 'gulp', 'dev', '--', '--gulpfile', gulpFile]);
          watcher.stdout.on('data', data => {
            console.log(`${service.name} watcher: `, data.toString());
          });
          watcher.stderr.on('data', data => {
            console.error(`${service.name} watcher error output: `, data.toString());
          });
          watcher.on('close', code => {
            console.log(`${service.name} watcher process exited with code ${code}`);
          });
        }
      } catch (err) {
        console.error(err);
      }
      return start();
    } else {
      try {
        require(`./${workspace}/${service.name}/build`)(() => {
          start();
        });
      } catch (e) {
        return start();
      }
    }
  }

  function watchServices(cb) {
    async.map(services, watchService, cb);
  }

  function watchService(service, cb) {
    debug('watching service: ', service);
    const dir = `${workspace}/${service.name}`;
    // TODO : respect gitignore per microservice
    let ignored = [/[/\\]\./, /\/node_modules\//, /\/dist\//, /\/email-templates\//, /\/web\/public\/components\//, /\/locale\//, /\/allure-results\//, /\/errorShots\//];
    if (process.env.UIDEBUG === 'true') {
      ignored.push(/.*\.less$/);
      ignored.push(/\/public\/js\/.*\.js$/);
    }
    ignored = ignored.concat(service.ignored ? service.ignored : []);

    const opts = {
      persistent   : true,
      // switch to debug the list of initial file to look at
      ignoreInitial: process.env.DEBUG !== 'true', // default to true
      ignored,
      cwd          : dir,
    };
    const watcher = chokidar.watch('.', opts);
    if (process.env.DEBUG === 'true') {
      watcher.on('add', path => {
        console.log('added', path);
      });
    }

    watcher.on('change', file => {
      debug('Watcher file changed: ', file, 'restarting service:', service);
      restartService(service, err => {
        if (err) console.error(`Warning: could not restart service: ${service.name} - ${err}`);
      });
    });
    return cb();
  }

  function getProc({ name }) {
    return _.find(procs, p => {
      return p.serviceName === name;
    });
  }

  function killService(service, cb) {
    debug('killing service: ', service);
    const proc = getProc(service);
    if (proc) {
      proc.kill('SIGTERM');
      setTimeout(() => {
        procs = _.remove(procs, ({ name }) => {
          return name === service.name;
        });
        return cb();
      }, 1000);
    } else {
      return cb();
    }
  }

  function restartService(service, cb) {
    restartQ.push({ service }, cb);
  }
};
