#!/usr/bin/env node

var system = require('./system.js');
var debug = require('debug')('ld:main');

function usage() {
  console.log('./localdev.js <command>');
  console.log('where command is one of: ');
  console.log('"init <system>": does a fresh setup of your local dev environment');
  console.log('"run <system>": runs all the services in your system');
  console.log('"testdata <system>": loads test data for each service');
  process.exit;
}

function main(cb) {
  var argv = require('minimist')(process.argv.slice(2));

  var command = argv._[0];
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
  if (err) console.error(err);
  else console.log(output);
});
