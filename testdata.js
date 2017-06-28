'use strict';

const debug = require('debug')('localdev:testdata');
const series = require('async/series');
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
const pg = require('pg');
const postgresUrl = `postgres://${process.env.POSTGRES_USERNAME || 'platform'}:${process.env.POSTGRES_PASSWORD || 'QdYx3D5y'}@${process.env.POSTGRES_HOST || 'localhost'}/postgres`;
const client = new pg.Client(postgresUrl);

module.exports = (systems) => {
  return new Promise ((resolve, reject) => {
    const sysName = 'zen';
    const system = systems[sysName];
    debug(system);
    if (!system) reject(`System not found: ${sysName}`);
    console.log('System:', sysName, util.inspect(system.stringify(), true, null) );
    setupDatabases(system.services)
      .then(runSeneca)
      .then(loadAllTestData)
      .then(killServices)
      .then(resolve)
      .catch(reject);
  });
};

function setupDatabases(services) {
  return new Promise ((resolve, reject) => {
    client.connect(err => {
      if (err) reject(new Error(`Postgres connection error: ${err}`));
      Promise.all(services.map(resetDatabase)).then(() => {
        client.end();
        resolve(services);
      }).catch(reject);
    });
  });
}

function resetDatabase(service) {
  return new Promise ((resolve, reject) => {
    if (process.env.ZENTEST) {
      dropDatabase(service.database)
        .then(createDatabase)
        .then(resolve)
        .catch(reject);
    } else {
      resolve();
    }
  });
}

function dropDatabase(database) {
  return new Promise ((resolve, reject) => {
    if (!database) resolve();
    const query = `DROP DATABASE IF EXISTS "${database}"`;
    client.query(query, err => {
      if (err) reject(new Error(`Error dropping database: ${err}`));
      console.log(`${database} dropped`);
      resolve(database);
    });
  });
}

function createDatabase(database) {
  return new Promise ((resolve, reject) => {
    if (!database) resolve();
    const query = `CREATE DATABASE "${database}"`;
    client.query(query, err => {
      if (err && includes(err.toString(), 'already exists')) {
        reject(new Error(`Error creating database: ${err}`));
      }
      console.log(`${database} created`);
      resolve(database);
    });
  });
}

function runSeneca(services) {
  return new Promise ((resolve, reject) => {
    seneca.listen({ timeout: 10000 });
    Promise.all(services.map(
      ({ test, base }) => {
        if (test) {
          // main test service of the µs
          seneca.client({ type: 'web', host: test.host, port: test.port, pin: { role: `${base}-test`, cmd: '*' } });
          // data loader specific to the µs
          seneca.client({ type: 'web', host: test.host, port: test.port, pin: { role: test.name, cmd: '*' } });
        }
      }
    )).then(() => resolve(services))
      .catch(reject);
  });
}

function loadAllTestData(services) {
  return new Promise ((resolve, reject) => {
    series([
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
      console.log('Test Data Loaded');
      resolve(services);
    });
  });
}

function createUsers(wfCb) {
  console.log('Creating Users');
  seneca.act({ role: 'test-user-data', cmd: 'insert', entity: 'user' }, wfCb);
}

function createAgreements(wfCb) {
  console.log('Creating Agreements');
  seneca.act({ role: 'test-user-data', cmd: 'insert', entity: 'agreement' }, wfCb);
}

function createDojos(wfCb) {
  console.log('Creating Dojos');
  seneca.act({ role: 'test-dojo-data', cmd: 'insert', entity: 'dojo' }, wfCb);
}

function createDojoLeads(wfCb) {
  console.log('Creating Dojo Leads');
  seneca.act({ role: 'test-dojo-data', cmd: 'insert', entity: 'dojo_lead' }, wfCb);
}

function createPolls(wfCb) {
  console.log('Creating Polls');
  seneca.act({ role: 'test-dojo-data', cmd: 'insert', entity: 'poll' }, wfCb);
}

function createEvents(wfCb) {
  console.log('Creating Events');
  seneca.act({ role: 'test-event-data', cmd: 'insert', entity: 'event' }, wfCb);
}

function linkDojoUsers(wfCb) {
  console.log('Linking Dojo and Users');
  seneca.act({ role: 'test-dojo-data', cmd: 'insert', entity: 'user_dojo' }, wfCb);
}

function linkEventsUsers(wfCb) {
  console.log('Linkng Events and Users');
  seneca.act({ role: 'test-event-data', cmd: 'insert', entity: 'application' }, wfCb);
}

function killServices(services) {
  return new Promise ((resolve, reject) => {
    const testServices = filter(services, 'test');
    Promise.all(testServices.map(killService)).then(() => {
      seneca.close((err) => {
        if (err) reject(err);
        resolve();
      });
    }).catch(reject);
  });
}

function killService({ base }, cb) {
  console.log(`suicide ${base}`);
  seneca.act({ role: `${base}-test`, cmd: 'suicide' }, cb);
}
