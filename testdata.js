'use strict';

const debug = require('debug')('localdev:testdata');
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
const postgresUrl = `postgres://${process.env.POSTGRES_USERNAME ||
  'platform'}:${process.env.POSTGRES_PASSWORD || 'QdYx3D5y'}@${process.env
  .POSTGRES_HOST || 'localhost'}/postgres`;
const client = new pg.Client(postgresUrl);

module.exports = systems => {
  return new Promise((resolve, reject) => {
    const sysName = 'zen';
    const system = systems[sysName];
    debug(system);
    if (!system) reject(`System not found: ${sysName}`);
    console.log(
      'System:',
      sysName,
      util.inspect(system.stringify(), true, null)
    );
    setupDatabases(system.services)
      .then(runSeneca)
      .then(loadAllTestData)
      .then(killServices)
      .then(resolve)
      .catch(reject);
  });
};

function setupDatabases(services) {
  return new Promise((resolve, reject) => {
    client.connect(err => {
      if (err) reject(new Error(`Postgres connection error: ${err}`));
      Promise.all(services.map(resetDatabase))
        .then(() => {
          client.end();
          resolve(services);
        })
        .catch(reject);
    });
  });
}

function resetDatabase(service) {
  return new Promise((resolve, reject) => {
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
  return new Promise((resolve, reject) => {
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
  return new Promise((resolve, reject) => {
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
  return new Promise((resolve, reject) => {
    seneca.listen({ timeout: 10000 });
    Promise.all(
      services.map(({ test, base }) => {
        if (test) {
          // main test service of the µs
          seneca.client({
            type: 'web',
            host: test.host,
            port: test.port,
            pin : {
              role: `${base}-test`,
              cmd : '*',
            },
          });
          // data loader specific to the µs
          seneca.client({
            type: 'web',
            host: test.host,
            port: test.port,
            pin : {
              role: test.name,
              cmd : '*',
            },
          });
        }
      })
    )
      .then(() => resolve(services))
      .catch(reject);
  });
}

function loadAllTestData(services) {
  return new Promise((resolve, reject) => {
    createUsers()
      .then(createAgreements)
      .then(createDojoLeads)
      .then(createDojos)
      .then(createPolls)
      .then(createEvents)
      .then(linkDojoUsers)
      .then(linkEventsUsers)
      .then(() => {
        console.log('Test Data Loaded');
        resolve(services);
      })
      .catch(reject);
  });
}

function createUsers() {
  return new Promise((resolve, reject) => {
    seneca.act(
      { role: 'test-user-data', cmd: 'insert', entity: 'user' },
      err => {
        if (err) reject(err);
        console.log('Created Users');
        resolve();
      }
    );
  });
}

function createAgreements() {
  return new Promise((resolve, reject) => {
    seneca.act(
      { role: 'test-user-data', cmd: 'insert', entity: 'agreement' },
      err => {
        if (err) reject(err);
        console.log('Created Agreements');
        resolve();
      }
    );
  });
}

function createDojos() {
  return new Promise((resolve, reject) => {
    seneca.act(
      { role: 'test-dojo-data', cmd: 'insert', entity: 'dojo' },
      err => {
        if (err) reject(err);
        console.log('Created Dojos');
        resolve();
      }
    );
  });
}

function createDojoLeads() {
  return new Promise((resolve, reject) => {
    seneca.act(
      { role: 'test-dojo-data', cmd: 'insert', entity: 'dojo_lead' },
      err => {
        if (err) reject(err);
        console.log('Created Dojo Leads');
        resolve();
      }
    );
  });
}

function createPolls() {
  return new Promise((resolve, reject) => {
    seneca.act(
      { role: 'test-dojo-data', cmd: 'insert', entity: 'poll' },
      err => {
        if (err) reject(err);
        console.log('Created Polls');
        resolve();
      }
    );
  });
}

function createEvents() {
  return new Promise((resolve, reject) => {
    seneca.act(
      { role: 'test-event-data', cmd: 'insert', entity: 'event' },
      err => {
        if (err) reject(err);
        console.log('Created Events');
        resolve();
      }
    );
  });
}

function linkDojoUsers() {
  return new Promise((resolve, reject) => {
    seneca.act(
      { role: 'test-dojo-data', cmd: 'insert', entity: 'user_dojo' },
      err => {
        if (err) reject(err);
        console.log('Linked Dojo and Users');
        resolve();
      }
    );
  });
}

function linkEventsUsers() {
  return new Promise((resolve, reject) => {
    seneca.act(
      { role: 'test-event-data', cmd: 'insert', entity: 'application' },
      err => {
        if (err) reject(err);
        console.log('Linked Events and Users');
        resolve();
      }
    );
  });
}

function killServices(services) {
  return new Promise((resolve, reject) => {
    const testServices = filter(services, 'test');
    Promise.all(testServices.map(killService))
      .then(() => {
        seneca.close(err => {
          if (err) reject(err);
          resolve();
        });
      })
      .catch(reject);
  });
}

function killService({ base }) {
  console.log(`suicide ${base}`);
  return new Promise((resolve, reject) => {
    seneca.act({ role: `${base}-test`, cmd: 'suicide' }, err => {
      if (err) reject(err);
      resolve();
    });
  });
}
