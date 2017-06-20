'use strict';

const debug = require('debug')('localdev:setup');
const async = require('async');
const command = require('./command.js');
const _ = require('lodash');
const util = require('util');
const dgram = require('dgram');

module.exports = (argv, systems, cb) => {
  debug(system);

  process.env.UIDEBUG = argv.uidebug || 'true'; // added as env var for use in services

  const usage = 'Usage: test <system-name>\n e.g. test zen';
  const sysName = argv._[1];
  if (!sysName) return cb(usage);

  const system = systems[sysName];
  if (!system) return cb(`System not found: ${sysName}`);

  const workspace = `workspace-${sysName}`;
  console.log('System:', sysName, util.inspect(system.stringify(), true, null), `workspace: ${workspace}`);

  let procs = [];

  const services = system.services;

  async.series([resetDatabase, runServices, setTestData, runTest, killServices], err => {
    console.log('Tests Finished', err);
    cb(err);
  });

  function resetDatabase(sCb) {
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
  }

  // One canno't simply use "run" from cp-local
  // because we don't want the watch nor the ui-debug
  function runServices(sCb) {
    const alive = {};
    const orchest = dgram.createSocket('udp4');
    orchest.bind(11404, '127.0.0.1');

    orchest.on('message', (msg, { port }) => {
      alive[msg] = port;
      if (_.keys(alive).length === _.filter(services, { broadcast: true }).length) {
        orchest.close();
        sCb();
      }
    });

    async.map(services, runService);
    function runService(service, mapCb) {
      function start() {
        const proc = command(cmd, dir, service.env, err => {
          if (err) console.error(`Error running service: ${err}`);
          else console.log(`Service terminated: ${service.name}`);
        });
        proc.serviceName = service.name;
        procs.push(proc);
        return mapCb();
      }
      if (!service.start) return mapCb();
      const dir = `${workspace}/${service.name}`;
      const cmd = service.start;
      debug('runService', dir, cmd);
      try {
        require(`./${workspace}/${service.name}/build`)(() => {
          start();
        });
      } catch (e) {
        return start();
      }
    }
  }

  function getProc({ name }) {
    return _.find(procs, ({ serviceName }) => {
      return serviceName === name;
    });
  }

  function killService(service, cb) {
    debug('killing service: ', service);
    const proc = getProc(service);
    if (proc) {
      proc.kill('SIGTERM');
      setTimeout(() => {
        procs = _.without(procs, ({ name }) => {
          return name === service.name;
        });
        return cb();
      }, 1000);
    } else {
      return cb();
    }
  }

  function killServices(sCb) {
    async.mapSeries(services, killService, sCb);
  }

  function setTestData(sCb) {
    command(`./localdev.js testdata ${sysName}`, '.', null, err => {
      if (err) console.error(`Error running service: ${err}`);
      else console.log(`Service terminated: ${sysName}`);
      console.log('Finished creating test data');
      sCb();
    });
  }

  // Need us to upgrade global node version to 4+ to get Promises as one of the sub-dep of wdio requires promises
  function runTest(sCb) {
    command('. ~/.nvm/nvm.sh && nvm use cp-e2e && npm test', 'workspace-zen/cp-e2e-tests', null, err => {
      if (err) console.error(`Error running service: ${err}`);
      else console.log('Service terminated: cp-e2e-tests', err);
      sCb();
    });
  }
};
