const system = require('./system.js');
const testdata = require('./testdata.js');

testdata(system)
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
