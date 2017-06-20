'use strict';

const debug = require('debug')('localdev:testdata');
const async = require('async');
const util = require('util');
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

module.exports = (argv, systems, cb) => {
  const usage = 'Usage: testdata <system-name> [service-name]\n e.g. testdata zen';
  const sysName = argv._[1];
  if (!sysName) return cb(usage);

  const system = systems[sysName];
  debug(system);
  if (!system) return cb(`System not found: ${sysName}`);

  const workspace = `workspace-${sysName}`;
  console.log('System:', sysName, util.inspect(system.stringify(), true, null), `workspace: ${workspace}`);

  const services = system.services;

  // load the test data
  async.series([runSeneca, loadAllTestData], err => {
    cb();
    process.exit(err ? 1 : 0);
  });

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
        console.log('Seneca orchestrator started');
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
};
