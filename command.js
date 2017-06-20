'use strict';
const _ = require('lodash');
const exec = require('child_process').exec;

function command(cmd, cwd, env, cb) {
  const proc = exec(cmd, { maxBuffer: Number.POSITIVE_INFINITY, cwd, env: _.extend(process.env, env) }, (err, stdout, stderr) => {
    if (err) {
      return cb(new Error(`Error running command: ${cmd} - ${err} - ${err.stack} - ${stderr}`));
    }
    cb();
  });
  proc.stdout.pipe(process.stdout);
  proc.stderr.pipe(process.stderr);
  return proc;
}

module.exports = command;
