
var exec = require('child_process').exec;

function command(cmd, cwd, cb) {
  var proc = exec(cmd, {maxBuffer: 600*1024, cwd: cwd}, function (err, stdout, stderr) {
    if (err)  return cb('Error running command: ' + cmd + ' - ' + err + ' - ' + err.stack + ' - ' + stderr);
    cb();
  });
  proc.stdout.pipe(process.stdout);
  proc.stderr.pipe(process.stderr);
  return proc;
}

module.exports = command;