'use strict';

const system = require('./system.js');
require('./testdata.js')(system).then(() => {
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
