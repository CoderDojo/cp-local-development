
var exec = require('child_process').exec;

function command(cmd, cb) {
  exec(cmd, {maxBuffer: 600*1024}, function (err, stdout, stderr) {
    if (err)  return cb('Error running command: ' + cmd + ' - ' + err + ' - ' + err.stack + ' - ' + stderr);
    cb();
  }).stdout.pipe(process.stdout);
}

module.exports = command;