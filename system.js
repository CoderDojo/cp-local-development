const map = require('lodash/map');
const toPlainObject = require('lodash/toPlainObject');
const isUndefined = require('lodash/isUndefined');

class Service {

  constructor(name, port, host) {
    this.base = `cp-${name}`;
    this.name = name;
    this.testPort = port;
    this.testHost = host;
  }

  get name() {
    const serviceName = `${this.base}-service`;
    return serviceName;
  }

  get database() {
    const serviceDB = `${this.base}${process.env.ZENTEST === 'true' ? '-test' : '-development'}`;
    return serviceDB;
  }

  get base() {
    return this.base;
  }

  get test() {
    if (isUndefined(this.testPort) || isUndefined(this.testHost)) return undefined;
    return {
      name: `test-${this.name}-data`,
      port: this.testPort,
      host: this.testHost,
    };
  }
}

module.exports = {
  zen: {
    get services() {
      return [
        new Service('dojos', 11301, process.env.CD_DOJOS || 'localhost'),
        new Service('users', 11303, process.env.CD_USERS || 'localhost'),
        new Service('events', 11306, process.env.CD_EVENTS || 'localhost'),
        new Service('oganisations'),
      ];
    },
    stringify() {
      return {
        services: map(this.services, toPlainObject),
      };
    },
  },
};
