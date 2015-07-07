#!/usr/bin/env node

var system = require('./system.js');
var debug = require('debug')('localdev:main');
var _ = require('lodash');

function usage() {
  console.log('Usage "./localdev.js <command>" where command is one of: ');
  console.log('  "init <system>": does a fresh setup of your local dev environment');
  console.log('  "run <system>": runs all the services in your system');
  console.log('  "testdata <system>": loads test data for each service');
  process.exit;
}

function main(cb) {
  var argv = require('minimist')(process.argv.slice(2));

  var command = argv._[0];
  if (!command) return usage();

  switch (command) {
    case 'init':
      require('./init.js')(argv, system, cb);
      break;
    case 'run':
      require('./run.js')(argv, system, cb);
      break;
    case 'testdata':
      require('./testdata.js')(argv, system, cb);
      break;
    default:
      return cb('unknown command: ' + command);
  }
}

main(function (err, output) {
  if (err) return console.error(err);
  if (output && typeof output === 'string') return console.log(output);
  var out =  _.filter(_.flatten(output), function (o) {
    if (o) return o;
  });
  console.log(out.join('\n'));
});
