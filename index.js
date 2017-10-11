/* eslint-disable no-console */
const debug = require('debug')('testdata');
const util = require('util');
const { includes, isUndefined } = require('lodash');
const { Pool } = require('pg');
const seneca = require('seneca')({
  timeout: 200000,
  transport: {
    type: 'web',
    timeout: 200000,
    web: {
      timeout: 200000,
      port: 11500,
    },
  },
  strict: { add: false, result: false },
});
const { promisify, delay } = require('bluebird');

seneca.actAsync = promisify(seneca.act, { context: seneca });
const systems = require('./lib/system.js');
const { createUsers, createAgreements } = require('./lib/insert-test-users.js')(
  seneca.actAsync,
);
const {
  createDojos,
  createDojoLeads,
  createPolls,
  linkDojoUsers,
} = require('./lib/insert-test-dojos.js')(seneca.actAsync);
const {
  createEvents,
  linkEventsUsers,
} = require('./lib/insert-test-events.js')(seneca.actAsync);

const client = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: 'postgres',
  user: process.env.POSTGRES_USERNAME || 'platform',
  password: process.env.POSTGRES_PASSWORD || 'QdYx3D5y',
});

(async () => {
  const sysName = 'zen';
  const system = systems[sysName];
  debug(system);
  if (isUndefined(system)) {
    console.error(new Error(`System not found: ${sysName}`));
    process.exit(1);
  }
  console.log('System:', sysName, util.inspect(system.stringify(), true, null));
  try {
    await setupDatabases(system.services);
    await runSeneca(system.services);
    await delay(10000); // This to give the mircoservices enough time to start
    await loadAllTestData();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

async function runSeneca(services) {
  try {
    seneca.listen({ timeout: 10000 }).use('entity');
    await Promise.all(services.map(addClient));
    seneca
      .client({
        type: 'web',
        host: process.env.CD_USERS || 'localhost',
        port: 10303,
        pin: {
          role: 'cd-agreements',
          cmd: '*',
        },
      })
      .client({
        type: 'web',
        host: process.env.CD_USERS || 'localhost',
        port: 10303,
        pin: {
          role: 'cd-profiles',
          cmd: '*',
        },
      });
  } catch (err) {
    throw err;
  }
}

function addClient({ host, port, base }) {
  if (!isUndefined(host) && !isUndefined(port)) {
    seneca.client({
      type: 'web',
      host,
      port,
      pin: {
        role: base,
        cmd: '*',
      },
    });
  }
  return Promise.resolve();
}

async function setupDatabases(services) {
  try {
    await client.connect();
    await Promise.all(services.map(resetDatabase));
    client.end();
  } catch (reject) {
    throw reject;
  }
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

async function dropDatabase(database) {
  if (isUndefined(database)) return;
  try {
    await client.query(`DROP DATABASE IF EXISTS "${database}"`);
  } catch (err) {
    throw new Error(`Error dropping database: ${err}`);
  }
  console.log(`${database} dropped`);
}

function createDatabase(database) {
  return new Promise((resolve, reject) => {
    if (isUndefined(database)) resolve();
    client
      .query(`CREATE DATABASE "${database}"`)
      .then(() => {
        console.log(`${database} created`);
        resolve();
      })
      .catch((err) => {
        if (includes(err.toString(), 'already exists')) {
          console.log(`${database} already existed`);
          resolve();
        } else {
          reject(new Error(`Error creating database: ${err}`));
        }
      });
  });
}

async function loadAllTestData() {
  try {
    console.log('Loading TestData');
    await createUsers();
    console.log('Created Users');
    await createAgreements();
    console.log('Created Agreements');
    await createDojoLeads();
    console.log('Created Dojo Leads');
    await createDojos();
    console.log('Created Dojos');
    await createPolls();
    console.log('Created Polls');
    await createEvents();
    console.log('Created Events');
    await linkDojoUsers();
    console.log('Linked Dojo and Users');
    await linkEventsUsers();
    console.log('Linked Events and Users');
    console.log('Test Data Loaded');
  } catch (err) {
    throw err;
  }
}
