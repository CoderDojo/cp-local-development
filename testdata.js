'use strict';

const debug = require('debug')('localdev:testdata');
const async = require('async');
const pg = require('pg');
const util = require('util');
const filter = require('lodash/filter');
const includes = require('lodash/includes');
const seneca = require('seneca')({
  timeout  : 200000,
  transport: {
    type   : 'web',
    timeout: 200000,
    web    : {
      timeout: 200000,
      port   : 11500,
    },
  },
  strict: { add: false, result: false },
});

module.exports = (systems) => {
  return new Promise ((resolve, reject) => {
    const sysName = 'zen';
    const system = systems[sysName];
    debug(system);
    if (!system) reject(`System not found: ${sysName}`);

    console.log('System:', sysName, util.inspect(system.stringify(), true, null) );

    const services = system.services;

    // load the test data
    async.series([
      resetDatabase,
      runSeneca,
      loadAllTestData,
      killServices,
      killOrchestrator,
    ], err => {
      if (err) reject(err);
      resolve();
    });

    function resetDatabase(sCb) {
      const conString = `postgres://${process.env.POSTGRES_USERNAME || 'platform'}:${process.env.POSTGRES_PASSWORD || 'QdYx3D5y'}@${process.env.POSTGRES_HOST || 'localhost'}/postgres`;

      const client = new pg.Client(conString);
      client.connect(err => {
        if (err) reject(`Postgres connection error: ${err}`);
        async.map(system.services, createDatabase, err => {
          client.end();
          sCb(err);
        });

        function createDatabase({ database }, mCb) {
          if (!database) return mCb();
          const q = `DROP DATABASE IF EXISTS "${database}"`;
          client.query(q, err => {
            if (err) reject(`Error dropping database: ${err}`);
            const q = `CREATE DATABASE "${database}"`;
            client.query(q, err => {
              if (err && includes(err.toString(), 'already exists')) {
                reject(`Error creating database: ${err}`);
              }
              return mCb();
            });
          });
        }
      });
    }

    function runSeneca(cb) {
      seneca.listen({ timeout: 10000 });
      async.mapSeries(
        services,
        ({ test, base }, sCb) => {
          if (test) {
            // main test service of the µs
            seneca.client({ type: 'web', host: test.host, port: test.port, pin: { role: `${base}-test`, cmd: '*' } });
            // data loader specific to the µs
            seneca.client({ type: 'web', host: test.host, port: test.port, pin: { role: test.name, cmd: '*' } });
          }
          sCb();
        },
        () => {
          cb();
        }
      );
    }

    function loadAllTestData(cb) {
      async.series([
        createUsers,
        createAgreements,
        createDojoLeads,
        createDojos,
        createPolls,
        createEvents,
        linkDojoUsers,
        linkEventsUsers,
      ], cb);
    }

    function createUsers(wfCb) {
      seneca.act({ role: 'test-user-data', cmd: 'insert', entity: 'user' }, wfCb);
    }

    function createAgreements(wfCb) {
      seneca.act({ role: 'test-user-data', cmd: 'insert', entity: 'agreement' }, wfCb);
    }

    function createDojos(wfCb) {
      seneca.act({ role: 'test-dojo-data', cmd: 'insert', entity: 'dojo' }, wfCb);
    }

    function createDojoLeads(wfCb) {
      seneca.act({ role: 'test-dojo-data', cmd: 'insert', entity: 'dojo_lead' }, wfCb);
    }

    function createPolls(wfCb) {
      seneca.act({ role: 'test-dojo-data', cmd: 'insert', entity: 'poll' }, wfCb);
    }

    function createEvents(wfCb) {
      seneca.act({ role: 'test-event-data', cmd: 'insert', entity: 'event' }, wfCb);
    }

    function linkDojoUsers(wfCb) {
      seneca.act({ role: 'test-dojo-data', cmd: 'insert', entity: 'user_dojo' }, wfCb);
    }

    function linkEventsUsers(wfCb) {
      seneca.act({ role: 'test-event-data', cmd: 'insert', entity: 'application' }, wfCb);
    }

    function killServices(cb) {
      const testServices = filter(services, 'test');
      async.mapSeries(testServices, killService, cb);
      function killService({ base }, mCb) {
        seneca.act({ role: `${base}-test`, cmd: 'suicide' }, mCb);
      }
    }
    function killOrchestrator(cb) {
      seneca.close(() => {
        console.log('Now run `docker-compose up zen` to start zen');
        cb();
      });
    }
  });
};
