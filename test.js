var debug = require('debug')('localdev:setup');
var async = require('async');
var command = require('./command.js');
var _ = require('lodash');
var chokidar = require('chokidar');
var util = require('util');
var child_process = require('child_process');
var fs = require('fs');
var dgram = require('dgram');

module.exports = function (argv, systems, cb) {
  debug(system);

  process.env.UIDEBUG = argv.uidebug || 'true'; // added as env var for use in services

  var usage = 'Usage: test <system-name>\n e.g. test zen';
  var sysName = argv._[1];
  if (!sysName) return cb(usage);

  var system = systems[sysName];
  if (!system) return cb('System not found: ' + sysName);

  var workspace = 'workspace-' + sysName;
  console.log('System:', sysName, util.inspect(system.stringify(), true, null), 'workspace: ' + workspace);

  var procs = [];

  var services = system.services;

  async.series([
    resetDatabase,
    runServices,
    setTestData,
    runTest,
    killServices
  ], function (err) {
    console.log('Tests Finished', err);
    cb(err);
  });

  function resetDatabase (sCb) {
    var pg = require('pg');
    var conString = util.format('postgres://%s:%s@%s/postgres',
                                system.env.POSTGRES_USERNAME,
                                system.env.POSTGRES_PASSWORD,
                                system.env.POSTGRES_HOST);

    var client = new pg.Client(conString);
    client.connect(function (err) {
      if (err) return cb('Postgres connection error: ' + err);
      async.map(system.services, createDatabase, function (err) {
        client.end();
        sCb(err);
      });

      function createDatabase (service, mCb) {
        if (!service.database) return mCb();
        var q = 'DROP DATABASE IF EXISTS "' + service.database + '"';
        client.query(q, function (err, result){
          if (err) {
            return cb('Error dropping database: ' + err);
          }
          var q = 'CREATE DATABASE "' + service.database + '"';
          client.query(q, function (err, result) {
            if (err) {
              // TODO - cheap and cheerful - do this instead:
              // SELECT datname FROM pg_catalog.pg_database WHERE lower(datname) = lower('dbname');
              if (err.toString().indexOf('already exists') === -1) {
                return cb('Error creating database: ' + err);
              }
            }
            return mCb();
          });
        });
      }
    });
  }

  // One canno't simply use "run" from cp-local
  // because we don't want the watch nor the ui-debug
  function runServices (sCb) {
    var alive = {};
    var orchest = dgram.createSocket('udp4');
    orchest.bind(11404, '127.0.0.1');

    orchest.on("message", function (msg, rinfo) {
      alive[msg] = rinfo.port;
      if (_.keys(alive).length === _.filter(services, {broadcast: true}).length) {
        orchest.close();
        sCb();
      }
    });

    async.map(services, runService);
    function runService (service, mapCb) {
      function start() {
        var proc = command(cmd, dir, service.env, function (err) {
          if (err) console.error('Error running service: ' + err);
          else console.log('Service terminated: ' + service.name);
        });
        proc.serviceName = service.name;
        procs.push(proc);
        return mapCb();
      }
      if (!service.start) return mapCb();
      var dir = workspace + '/' + service.name;
      var cmd = service.start;
      debug('runService', dir, cmd);
      try {
        require('./' + workspace + '/' + service.name + '/build')(function () {
          start();
        });
      } catch (e) {
        return start();
      }
    }
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
        procs = _.without(procs, function (s) {
          return s.name === service.name;
        });
        return cb();
      }, 1000);
    } else {
      return cb();
    }
  }

  function killServices (sCb) {
    async.mapSeries(services, killService, sCb);
  }

  function setTestData (sCb) {
    command('./localdev.js testdata ' + sysName , '.', null, function (err) {
      if (err) console.error('Error running service: ' + err);
      else console.log('Service terminated: ' + sysName);
      console.log('Finished creating test data');
      sCb();
    });
  }

  // Need us to upgrade global node version to 4+ to get Promises as one of the sub-dep of wdio requires promises
  function runTest (sCb) {
    command('. ~/.nvm/nvm.sh && nvm use cp-e2e && npm test', 'workspace-zen/cp-e2e-tests', null, function (err) {
      if (err) console.error('Error running service: ' + err);
      else console.log('Service terminated: cp-e2e-tests', err);
      sCb();
    });
  }
};
