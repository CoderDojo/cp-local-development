var debug = require('debug')('ld:setup');
var async = require('async');
var mkdirp = require('mkdirp');

module.exports = function(argv, systems, cb) {
  debug(system);

  var usage = 'Usage: setup <system-name>\n e.g. setup phase1';
  var sysName = argv._[1];
  if (!sysName) return cb(usage);
  if (!systems[sysName]) return cb('System not found: ' + sysName);

  var system = systems[sysName];
  var workspace = 'workspace-' + sysName;

  // do all the setup
  async.series([createWorkspace], cb);

  function createWorkspace(cb){
    mkdirp(workspace, cb);
  }
};