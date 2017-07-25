const map = require('lodash/map');
const toPlainObject = require('lodash/toPlainObject');
const isUndefined = require('lodash/isUndefined');

class Service {
  constructor(name, port, host) {
    this.base = `cp-${name}`;
    this.serviceName = name;
    this.testPort = port;
    this.testHost = host;
  }

  get name() {
    return `${this.base}-service`;
  }

  get database() {
    return `${this.base}${process.env.ZENTEST === 'true' ? '-test' : '-development'}`;
  }

  get test() {
    if (isUndefined(this.testPort) || isUndefined(this.testHost)) return undefined;
    return {
      name: `test-${this.serviceName}-data`,
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
