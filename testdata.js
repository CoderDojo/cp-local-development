const debug = require('debug')('localdev:testdata');
const util = require('util');
const filter = require('lodash/filter');
const isUndefined = require('lodash/isUndefined');
const includes = require('lodash/includes');
const pg = require('pg');
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

const postgres = {
  host    : process.env.POSTGRES_HOST || 'localhost',
  port    : 5432,
  database: 'postgres',
  user    : process.env.POSTGRES_USERNAME || 'platform',
  password: process.env.POSTGRES_PASSWORD || 'QdYx3D5y',
};
const client = new pg.Client(postgres);

module.exports = async systems => {
  const sysName = 'zen';
  const system = systems[sysName];
  debug(system);
  if (!system) throw new Error(`System not found: ${sysName}`);
  console.log('System:', sysName, util.inspect(system.stringify(), true, null));
  try {
    await setupDatabases(system.services);
    await runSeneca(system.services);
    await loadAllTestData();
    await killServices(system.services);
  } catch (err) {
    throw err;
  }
};

function setupDatabases(services) {
  client.connect(async err => {
    if (err) throw new Error(`Postgres connection error: ${err}`);
    try {
      await Promise.all(services.map(resetDatabase));
      client.end();
    } catch (reject) {
      client.end();
      throw reject;
    }
  });
}

async function resetDatabase({ database }) {
  if (isUndefined(database)) return;
  try {
    if (process.env.ZENTEST === 'true') await dropDatabase(database);
    await createDatabase(database);
  } catch (err) {
    throw err;
  }
}

function dropDatabase(database) {
  return new Promise((resolve, reject) => {
    if (!database) resolve();
    const query = `DROP DATABASE IF EXISTS "${database}"`;
    client.query(query, err => {
      if (err) reject(new Error(`Error dropping database: ${err}`));
      console.log(`${database} dropped`);
      resolve();
    });
  });
}

function createDatabase(database) {
  return new Promise((resolve, reject) => {
    if (!database) resolve();
    const query = `CREATE DATABASE "${database}"`;
    client.query(query, err => {
      if (err && !includes(err.toString(), 'already exists')) {
        reject(new Error(`Error creating database: ${err}`));
      }
      console.log(`${database} created`);
      resolve();
    });
  });
}

async function runSeneca(services) {
  try {
    seneca.listen({ timeout: 10000 });
    await Promise.all(services.map(addClient));
  } catch (err) {
    throw err;
  }
}

function addClient({ test, base }) {
  if (!isUndefined(test.name) && !isUndefined(test.host) && !isUndefined(test.port)) {
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
  return Promise.resolve();
}

async function loadAllTestData() {
  try {
    await createUsers();
    await createAgreements();
    await createDojoLeads();
    await createDojos();
    await createPolls();
    await createEvents();
    await linkDojoUsers();
    await linkEventsUsers();
    console.log('Test Data Loaded');
  } catch (err) {
    throw err;
  }
}

function createUsers() {
  return new Promise((resolve, reject) => {
    seneca.act({
      role  : 'test-user-data',
      cmd   : 'insert',
      entity: 'user',
    }, err => {
      if (err) reject(err);
      console.log('Created Users');
      resolve();
    });
  });
}

function createAgreements() {
  return new Promise((resolve, reject) => {
    seneca.act({
      role  : 'test-user-data',
      cmd   : 'insert',
      entity: 'agreement',
    }, err => {
      if (err) reject(err);
      console.log('Created Agreements');
      resolve();
    });
  });
}

function createDojos() {
  return new Promise((resolve, reject) => {
    seneca.act({
      role  : 'test-dojo-data',
      cmd   : 'insert',
      entity: 'dojo',
    }, err => {
      if (err) reject(err);
      console.log('Created Dojos');
      resolve();
    });
  });
}

function createDojoLeads() {
  return new Promise((resolve, reject) => {
    seneca.act({
      role  : 'test-dojo-data',
      cmd   : 'insert',
      entity: 'dojo_lead',
    }, err => {
      if (err) reject(err);
      console.log('Created Dojo Leads');
      resolve();
    });
  });
}

function createPolls() {
  return new Promise((resolve, reject) => {
    seneca.act({
      role  : 'test-dojo-data',
      cmd   : 'insert',
      entity: 'poll',
    }, err => {
      if (err) reject(err);
      console.log('Created Polls');
      resolve();
    });
  });
}

function createEvents() {
  return new Promise((resolve, reject) => {
    seneca.act({
      role  : 'test-event-data',
      cmd   : 'insert',
      entity: 'event',
    }, err => {
      if (err) reject(err);
      console.log('Created Events');
      resolve();
    });
  });
}

function linkDojoUsers() {
  return new Promise((resolve, reject) => {
    seneca.act({
      role  : 'test-dojo-data',
      cmd   : 'insert',
      entity: 'user_dojo',
    }, err => {
      if (err) reject(err);
      console.log('Linked Dojo and Users');
      resolve();
    });
  });
}

function linkEventsUsers() {
  return new Promise((resolve, reject) => {
    seneca.act({
      role  : 'test-event-data',
      cmd   : 'insert',
      entity: 'application',
    }, err => {
      if (err) reject(err);
      console.log('Linked Events and Users');
      resolve();
    });
  });
}

async function killServices(services) {
  const testServices = filter(services, service => !isUndefined(service.test.host));
  try {
    await Promise.all(testServices.map(killService));
    seneca.close(err => {
      if (err) throw (err);
    });
  } catch (err) {
    throw err;
  }
}

function killService({ base }) {
  console.log(`shutdown ${base}`);
  return new Promise((resolve, reject) => {
    seneca.act({ role: `${base}-test`, cmd: 'suicide' }, err => {
      if (err) reject(err);
      resolve();
    });
  });
}
