var debug = require('debug')('ld:setup');
var async = require('async');
var mkdirp = require('mkdirp');
var command = require('./command.js');
var fs = require('fs');

module.exports = function(argv, systems, cb) {
  debug(system);

  var usage = 'Usage: setup <system-name>\n e.g. setup phase1';
  var sysName = argv._[1];
  if (!sysName) return cb(usage);
  if (!systems[sysName]) return cb('System not found: ' + sysName);

  var system = systems[sysName];
  var workspace = 'workspace-' + sysName;

  // do all the setup
  async.series([
    createWorkspace,
    initRepos,
    checkoutBranches,
    npmInstalls
  ], cb);

  function createWorkspace(cb){
    mkdirp(workspace, cb);
  }

  function initRepos(cb) {
    async.map(system.services, initRepo, cb);
  }

  function initRepo(service, cb) {
    fs.exists(workspace + '/' + service.name, function(exists) {
      if (exists === true) return cb();
      var cmd = 'cd ' + workspace + ' && git clone ' + service.repo + ' ' + service.name;
      debug('initRepo', cmd);
      command(cmd, cb);
    });
  }

  function checkoutBranches(cb) {
    async.map(system.services, checkoutBranch, cb);
  }

  function checkoutBranch(service, cb) {
    debug('checkoutBranch', cmd);
    var cmd = 'cd ' + workspace + '/' + service.name + ' && git checkout ' + service.branch;
    command(cmd, cb);
  }

  function npmInstalls(cb) {
    async.map(system.services, npmInstall, cb);
  }

  function npmInstall(service, cb) {
    var cmd = 'cd ' + workspace + '/' + service.name + ' && npm install .';
    debug('npmInstall', cmd);
    command(cmd, cb);
  }

};