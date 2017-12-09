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
const { createUsers, createAgreements } = require('./lib/insert-test-users.js')(seneca);
const {
  createDojos,
  createDojoLeads,
  createPolls,
  linkDojoUsers,
} = require('./lib/insert-test-dojos.js')(seneca);
const { createEvents, linkEventsUsers } = require('./lib/insert-test-events.js')(seneca);

const client = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: 'postgres',
  user: process.env.POSTGRES_USERNAME || 'platform',
  password: process.env.POSTGRES_PASSWORD || 'QdYx3D5y',
});

const sysName = 'zen';
const system = systems[sysName];
debug(system);
if (isUndefined(system)) {
  console.error(new Error(`System not found: ${sysName}`));
  process.exit(1);
}
console.log('System:', sysName, util.inspect(system.stringify(), true, null));
setupDatabases(system.services)
  .then(runSeneca(system.services))
  .then(
    // This to give the mircoservices enough time to start
    delay(10000)
  )
  .then(loadAllTestData)
  .then(process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

function runSeneca(services) {
  seneca.listen({ timeout: 10000 }).use('entity');
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
  return Promise.all(services.map(addClient));
}

async function addClient({ host, port, base }) {
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
}

function setupDatabases(services) {
  return client.connect().then(Promise.all(services.map(resetDatabase))).then(client.end());
}

async function resetDatabase({ database }) {
  if (isUndefined(database)) return;
  return createDatabase(database);
}

async function dropDatabase(database) {
  if (isUndefined(database)) return;
  return client.query(`DROP DATABASE IF EXISTS "${database}"`);
}

async function createDatabase(database) {
  if (isUndefined(database)) return;
  try {
    await client.query(`CREATE DATABASE "${database}"`);
    console.log(`${database} created`);
  } catch (err) {
    if (includes(err.toString(), 'already exists')) {
      console.log(`${database} already existed`);
      return;
    }
    throw new Error(`Error creating database: ${err}`);
  }
}

function loadAllTestData() {
  console.log('Loading TestData');
  return createUsers()
    .then(console.log('Created Users'))
    .then(createAgreements)
    .then(console.log('Created Agreements'))
    .then(createDojoLeads)
    .then(console.log('Created Dojo Leads'))
    .then(createDojos)
    .then(console.log('Created Dojos'))
    .then(createPolls)
    .then(console.log('Created Polls'))
    .then(createEvents)
    .then(console.log('Created Events'))
    .then(linkDojoUsers)
    .then(console.log('Linked Dojo and Users'))
    .then(linkEventsUsers)
    .then(() => {
      console.log('Linked Events and Users');
      console.log('Test Data Loaded');
    });
}
