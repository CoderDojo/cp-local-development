var debug = require('debug')('ld:setup');
var async = require('async');
var command = require('./command.js');
var _ = require('lodash');
var chokidar = require('chokidar-child');

module.exports = function(argv, systems, cb) {
  debug(system);

  var usage = 'Usage: run <system-name>\n e.g. run phase1';
  var sysName = argv._[1];
  if (!sysName) return cb(usage);
  if (!systems[sysName]) return cb('System not found: ' + sysName);

  var system = systems[sysName];
  var workspace = 'workspace-' + sysName;
  var procs = [];

  // do all the setup
  async.series([
    runServices,
    watchServices
  ], cb);

  function runServices(cb) {
    async.map(system.services, runService, cb);
  }

  function runService(service, cb) {
    var dir = workspace + '/' + service.name;
    var cmd = service.start;
    debug('runService', dir, cmd);
    var proc = command(cmd, dir, function(err) {
      if (err) return cb(err);
      console.log('Service terminated: ' + service.name);
    });

    proc.serviceName = service.name;
    procs.push(proc);
    return cb();
  }

  function watchServices(cb) {
    async.map(system.services, watchService, cb);
  }

  function watchService(service, cb) {
    debug('watching service: ', service);
    var dir = workspace + '/' + service.name;
    var ignored = [/[\/\\]\./, /node_modules/].concat(service.ignored ? service.ignored : []);
    var watcher = chokidar.watch('.', {ignored: ignored, cwd:dir});

    watcher.on('change', function(file) {
      debug('Watcher file changed: ', file, 'restarting service:', service);
      restartService(service, function (err) {
        if (err) console.error('Warning: could not restart service: ' + service.name + ' - ' + err);
      });
    });
    return cb();
  }

  function getProc(service) {
    return _.find(procs, function(p) {
      return p.serviceName === service.name;
    });
  }

  function killService(service, cb) {
    debug('killing service: ', service);
    var proc = getProc(service);
    if (proc) {
      proc.kill('SIGTERM');
      setTimeout(function() {
        procs = _.remove(procs, function(s) {
          return s.name === service.name;
        });
        return cb();
      }, 2000);  // TODO - hackity hack..
    } else {
      return cb();
    }
  }

  function restartService(service, cb) {
    debug('restarting service', service);
    killService(service, function(err) {
      if (err) return cb(err);
      runService(service, cb);
    });
  }

};