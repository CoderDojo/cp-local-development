#!/usr/bin/env node
'use strict';

const system = require('./system.js');
const _ = require('lodash');

function usage() {
  console.log('Usage "./localdev.js <command>" where command is one of: ');
  console.log('  "testdata <system>": loads test data for each service');
  console.log('  "test <system>": reset test data and run test');
  process.exit;
}

function main(cb) {
  const argv = require('minimist')(process.argv.slice(2));
  process.env.ZENTEST = argv.zentest || 'false'; // added as env var for use in services
  const command = argv._[0];
  if (!command) return usage();

  switch (command) {
  case 'testdata':
    require('./testdata.js')(argv, system, cb);
    break;
  case 'test':
      // Assume zentest true by default
    process.env.ZENTEST = argv.zentest || 'true'; // added as env var for use in services
    require('./test.js')(argv, system, cb);
    break;
  default:
    return cb(`unknown command: ${command}`);
  }
}

main((err, output) => {
  if (err) return console.error(err);
  if (output && typeof output === 'string') return console.log(output);
  const out = _.filter(_.flatten(output), o => {
    if (o) return o;
  });
  console.log(out.join('\n'));
});
