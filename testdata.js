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
    resetDatabase(system.services)
      .then(runSeneca)
      .then(loadAllTestData)
      .then(killServices)
      .then(resolve)
      .catch(reject);
  });
};

function resetDatabase(services) {
  return new Promise ((resolve, reject) => {
    const postgresUrl = `postgres://${process.env.POSTGRES_USERNAME || 'platform'}:${process.env.POSTGRES_PASSWORD || 'QdYx3D5y'}@${process.env.POSTGRES_HOST || 'localhost'}/postgres`;

    const client = new pg.Client(postgresUrl);
    client.connect(err => {
      if (err) reject(new Error(`Postgres connection error: ${err}`));
      Promise.all(services.map(createDatabase)).then(() => {
        client.end();
        resolve(services);
      }).catch(reject);
    });

    function createDatabase({ database }) {
      return new Promise ((resolve, reject) => {
        if (!database) resolve();
        const q = `DROP DATABASE IF EXISTS "${database}"`;
        client.query(q, err => {
          if (err) reject(new Error(`Error dropping database: ${err}`));
          const q = `CREATE DATABASE "${database}"`;
          client.query(q, err => {
            if (err && includes(err.toString(), 'already exists')) {
              reject(new Error(`Error creating database: ${err}`));
            }
            resolve();
          });
        });
      });
    }
  });
}

function runSeneca(services) {
  return new Promise ((resolve, reject) => {
    seneca.listen({ timeout: 10000 });
    async.mapSeries(
      services,
      ({ test, base }, cb) => {
        if (test) {
          // main test service of the µs
          seneca.client({ type: 'web', host: test.host, port: test.port, pin: { role: `${base}-test`, cmd: '*' } });
          // data loader specific to the µs
          seneca.client({ type: 'web', host: test.host, port: test.port, pin: { role: test.name, cmd: '*' } });
        }
        cb();
      },
      (err) => {
        if (err) reject(err);
        resolve(services);
      }
    );
  });
}

function loadAllTestData(services) {
  return new Promise ((resolve, reject) => {
    async.series([
      createUsers,
      createAgreements,
      createDojoLeads,
      createDojos,
      createPolls,
      createEvents,
      linkDojoUsers,
      linkEventsUsers,
    ], (err) => {
      if (err) reject(err);
      resolve(services);
    });
  });
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

function killServices(services) {
  return new Promise ((resolve, reject) => {
    const testServices = filter(services, 'test');
    async.mapSeries(testServices, killService, (err) => {
      if (err) reject(err);
      seneca.close((err) => {
        if (err) reject(err);
        resolve();
      });
    });
  });
}

function killService({ base }, cb) {
  console.log(`suicide ${base}`);
  seneca.act({ role: `${base}-test`, cmd: 'suicide' }, cb);
}
