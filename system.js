const map = require('lodash/map');
const toPlainObject = require('lodash/toPlainObject');

class Service {
  constructor(name, port, host) {
    this.base = `cp-${name}s`;
    this.test = {};
    this.test.port = port;
    this.test.host = host;
    this.test.name = `test-${name}-data`;
    this.name = `${this.base}-service`;
    this.database = `${this.base}${process.env.ZENTEST === 'true' ? '-test' : '-development'}`;
  }
}

module.exports = {
  zen: {
    get services() {
      return [
        new Service('dojo', 11301, process.env.CD_DOJOS || 'localhost'),
        new Service('user', 11303, process.env.CD_USERS || 'localhost'),
        new Service('event', 11306, process.env.CD_EVENTS || 'localhost'),
        new Service('oganisation'),
      ];
    },
    stringify() {
      return {
        services: map(this.services, toPlainObject),
      };
    },
  },
};
