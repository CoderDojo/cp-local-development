var debug = require('debug')('localdev:testdata');
var async = require('async');
var command = require('./command.js');
var _ = require('lodash');
var util = require('util');
var dgram = require('dgram');
var seneca = require('seneca')({
    timeout: 200000,
    transport: {
      type: 'web',
      timeout: 200000,
      web: {
        timeout: 200000,
        port: 11500
      }
    },
    strict: {add: false, result: false}});

module.exports = function (argv, systems, cb) {
  debug(system);
  var usage = 'Usage: testdata <system-name> [service-name]\n e.g. testdata zen';
  var sysName = argv._[1];
  if (!sysName) return cb(usage);

  var system = systems[sysName];
  if (!system) return cb('System not found: ' + sysName);

  var workspace = 'workspace-' + sysName;
  console.log('System:', sysName, util.inspect(system.stringify(), true, null), 'workspace: ' + workspace);

  var services = system.services;

  // load the test data
  async.series([
    runSeneca,
    runTestServices,
    loadAllTestData,
    killServices,
    killOrchestrator
  ], function (err) {
    cb();
    process.exit(err? 1 : 0);
  });

  function runSeneca (cb) {
    seneca.listen({timeout: 10000});
    async.mapSeries(services, function (service, sCb) {
      if (service.test) {
        // main test service of the µs
        seneca.client({type: 'web', port: service.test.port, pin: {role: service.base + '-test', cmd: '*' }});
        // data loader specific to the µs
        seneca.client({type: 'web', port: service.test.port, pin: {role: service.test.name, cmd: '*' }});
      }
      sCb();
    }, function (err, services) {
      console.log('Seneca orchestrator started');
      cb();
    });
  }

  function runTestServices (cb) {
    var alive = {};
    var orchest = dgram.createSocket('udp4');
    orchest.bind(11404, '127.0.0.1');

    orchest.on("message", function (msg, rinfo) {
      alive[msg] = rinfo.port;
      if (_.keys(alive).length === _.filter(services, {broadcast: true}).length) {
        orchest.close();
        // When all µs are running, continue
        cb();
      }
    });
    async.mapSeries(services, runService);
  }

  function loadAllTestData (cb) {
    async.series([
      createUsers,
      createAgreements,
      createDojoLeads,
      createDojos,
      createPolls,
      createEvents,
      linkDojoUsers,
      linkEventsUsers
    ], cb);
  }

  function createUsers (wfCb) {
    seneca.act({role: 'test-user-data', cmd: 'insert', entity: 'user'}, wfCb);
  }

  function createAgreements (wfCb) {
    seneca.act({role: 'test-user-data', cmd: 'insert', entity: 'agreement'}, wfCb);
  }

  function createDojos (wfCb) {
    seneca.act({role: 'test-dojo-data', cmd: 'insert', entity: 'dojo'}, wfCb);
  }

  function createDojoLeads (wfCb) {
    seneca.act({role: 'test-dojo-data', cmd: 'insert', entity: 'dojo_lead'}, wfCb);
  }

  function createPolls (wfCb) {
    seneca.act({role: 'test-dojo-data', cmd: 'insert', entity: 'poll'}, wfCb);
  }

  function createEvents (wfCb) {
    seneca.act({role: 'test-event-data', cmd: 'insert', entity: 'event'}, wfCb);
  }

  function linkDojoUsers (wfCb) {
    seneca.act({role: 'test-dojo-data', cmd: 'insert', entity: 'user_dojo'}, wfCb);
  }

  function linkEventsUsers (wfCb) {
    seneca.act({role: 'test-event-data', cmd: 'insert', entity: 'application'}, wfCb);
  }

  function runService (service, cb) {
    if (!service.test) return cb();
    var dir = workspace + '/' + service.name;
    var cmd = service.test.start;
    command(cmd, dir, service.env, function (err) {
      if (err) console.error('Error running service: ' + service.name, err);
      else console.log('Service terminated:', service.name);
    });
    // This function is async as it runs a µs and wait for data loading callback
    // and doesn't wait for it to die (callback of command fn)
    cb();
  }

  function killServices (cb) {
    var testServices = _.filter(services, 'test');
    async.mapSeries(testServices, killService, cb);
    function killService (service, mCb) {
      seneca.act({role: service.base + '-test', cmd: 'suicide'}, mCb);
    }
  }
  function killOrchestrator (cb) {
    seneca.close(function(){
      cb();
    });
  }
};
