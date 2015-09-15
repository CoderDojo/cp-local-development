var debug = require('debug')('localdev:setup');
var async = require('async');
var command = require('./command.js');
var _ = require('lodash');
var chokidar = require('chokidar');
var util = require('util');

module.exports = function (argv, systems, cb) {
  debug(system);

  var usage = 'Usage: run <system-name>\n e.g. run phase1\n e.g. run phase3 cp-zen-platform';
  var sysName = argv._[1];
  if (!sysName) return cb(usage);

  var system = systems[sysName];
  if (!system) return cb('System not found: ' + sysName);

  var workspace = 'workspace-' + sysName;
  console.log('System:', sysName, util.inspect(system.stringify(), true, null), 'workspace: ' + workspace);

  var procs = [];

  var serviceName = argv._[2];
  var services = system.services;
  if (serviceName) {
    var service = _.findWhere(system.services, {name: serviceName});
    if (!service) return cb('Service not found: ' + serviceName);
    services = [service];
  }

  // restart queue - ensures only one service restarted at a time
  var restartQ = async.queue(function (task, cb) {
    var service = task.service;
    debug('restarting service', service);
    killService(service, function (err) {
      if (err) return cb(err);
      runService(service, cb);
    });
  }, 1);

  // run the services!
  async.series([
    runServices,
    watchServices
  ], cb);

  function runServices (cb) {
    async.map(services, runService, cb);
  }

  function runService (service, cb) {
    var dir = workspace + '/' + service.name;
    var cmd = service.start;
    debug('runService', dir, cmd);
    var proc = command(cmd, dir, service.env, function (err) {
      if (err) console.error('Error running service: ' + err);
      else console.log('Service terminated: ' + service.name);
    });

    proc.serviceName = service.name;
    procs.push(proc);
    return cb();
  }

  function watchServices (cb) {
    async.map(services, watchService, cb);
  }

  function watchService (service, cb) {
    debug('watching service: ', service);
    var dir = workspace + '/' + service.name;
    var ignored = [/[\/\\]\./, /node_modules/].concat(service.ignored ? service.ignored : []);

    var opts = {
      persistent: true,
      ignoreInitial: true,
      ignored: ignored,
      cwd: dir
    };
    var watcher = chokidar.watch('.', opts);

    watcher.on('change', function (file) {
      debug('Watcher file changed: ', file, 'restarting service:', service);
      restartService(service, function (err) {
        if (err) console.error('Warning: could not restart service: ' + service.name + ' - ' + err);
      });
    });
    return cb();
  }

  function getProc (service) {
    return _.find(procs, function (p) {
      return p.serviceName === service.name;
    });
  }

  function killService (service, cb) {
    debug('killing service: ', service);
    var proc = getProc(service);
    if (proc) {
      proc.kill('SIGTERM');
      setTimeout(function () {
        procs = _.remove(procs, function (s) {
          return s.name === service.name;
        });
        return cb();
      }, 1000);
    } else {
      return cb();
    }
  }

  function restartService (service, cb) {
    restartQ.push({service: service}, cb);
  }
};
