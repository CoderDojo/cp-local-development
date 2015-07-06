var debug = require('debug')('localdev:testdata');
var async = require('async');
var command = require('./command.js');
var _ = require('lodash');
var util = require('util');

module.exports = function(argv, systems, cb) {
  debug(system);

  var usage = 'Usage: testdata <system-name>\n e.g. testdata phase1';
  var sysName = argv._[1];
  if (!sysName) return cb(usage);

  var system = systems[sysName];
  if (!system) return cb('System not found: ' + sysName);

  var workspace = 'workspace-' + sysName;
  console.log('System:', sysName, util.inspect(system.stringify(), true, null), 'workspace: ' + workspace);

  // load the test data
  async.series([
    loadAllTestData,
  ], cb);

  function loadAllTestData(cb) {
    async.map(system.services, loadTestData, cb);
  }

  function loadTestData(service, cb) {
    if (!service.testdata) return cb();
    var dir = workspace + '/' + service.name;
    var cmd = service.testdata;
    debug('loadTestData', dir, cmd);
    command(cmd, dir, service.env, cb);
  }
};