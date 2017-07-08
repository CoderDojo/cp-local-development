const isUndefined = require('lodash/isUndefined');
const system = require('./system.js');
const testdata = require('./testdata.js');
const init = require('./init.js');

const arg = process.argv[2];
if (!isUndefined(arg) && arg === 'init') {
  init(system)
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
} else {
  testdata(system)
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
