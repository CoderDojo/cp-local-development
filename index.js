#!/usr/bin/env node

var system = require('./system.js');
var debug = require('debug')('ld:main');

function usage() {
  console.log('./localdev.js <command>');
  console.log('where command is one of: ');
  console.log('"setup <system>": does a fresh setup of your local dev environment');
  process.exit;
}

function main(cb) {
  var argv = require('minimist')(process.argv.slice(2));
  if (!argv.command) {
    usage();
  }

  console.log("ARGV", argv);
  var command = argv._[0];
  switch (command) {
    case 'setup':
      require('./setup.js')(argv, system, cb);
      break;
    default:
      return cb('unknown command: ' + command);
  }
}

main(function (err, output) {
  if (err) console.error(err);
  else console.log(output);
});