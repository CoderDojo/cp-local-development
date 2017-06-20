'use strict';

const debug = require('debug')('localdev:testdata');
const async = require('async');
const command = require('./command.js');
const _ = require('lodash');
const util = require('util');
const dgram = require('dgram');
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
  debug(system);
  const usage = 'Usage: testdata <system-name> [service-name]\n e.g. testdata zen';
  const sysName = argv._[1];
  if (!sysName) return cb(usage);

  const system = systems[sysName];
  if (!system) return cb(`System not found: ${sysName}`);

  const workspace = `workspace-${sysName}`;
  console.log('System:', sysName, util.inspect(system.stringify(), true, null), `workspace: ${workspace}`);

  const services = system.services;

  // load the test data
  async.series([runSeneca, runTestServices, loadAllTestData, killServices, killOrchestrator], err => {
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
          seneca.client({ type: 'web', port: test.port, pin: { role: `${base}-test`, cmd: '*' } });
          // data loader specific to the µs
          seneca.client({ type: 'web', port: test.port, pin: { role: test.name, cmd: '*' } });
        }
        sCb();
      },
      () => {
        console.log('Seneca orchestrator started');
        cb();
      }
    );
  }

  function runTestServices(cb) {
    const alive = {};
    const orchest = dgram.createSocket('udp4');
    orchest.bind(11404, '127.0.0.1');

    orchest.on('message', (msg, { port }) => {
      alive[msg] = port;
      if (_.keys(alive).length === _.filter(services, { broadcast: true }).length) {
        orchest.close();
        // When all µs are running, continue
        cb();
      }
    });
    async.mapSeries(services, runService);
  }

  function loadAllTestData(cb) {
    async.series([createUsers, createAgreements, createDojoLeads, createDojos, createPolls, createEvents, linkDojoUsers, linkEventsUsers], cb);
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

  function runService({ test, name, env }, cb) {
    if (!test) return cb();
    const dir = `${workspace}/${name}`;
    const cmd = test.start;
    command(cmd, dir, env, err => {
      if (err) console.error(`Error running service: ${name}`, err);
      else console.log('Service terminated:', name);
    });
    // This function is async as it runs a µs and wait for data loading callback
    // and doesn't wait for it to die (callback of command fn)
    cb();
  }

  function killServices(cb) {
    const testServices = _.filter(services, 'test');
    async.mapSeries(testServices, killService, cb);
    function killService({ base }, mCb) {
      seneca.act({ role: `${base}-test`, cmd: 'suicide' }, mCb);
    }
  }
  function killOrchestrator(cb) {
    seneca.close(() => {
      cb();
    });
  }
};
