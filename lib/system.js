const { map, toPlainObject, isUndefined } = require('lodash');

class Service {
  constructor(name, port, host) {
    this.base = `cd-${name}`;
    if (!isUndefined(port)) this.port = port;
    if (!isUndefined(host)) this.host = host;
    this.name = `cp-${name}-service`;
    this.database = `cp-${name}-development`;
  }
}

module.exports = {
  zen: {
    get services() {
      return [
        new Service('dojos', 10301, process.env.CD_DOJOS || 'localhost'),
        new Service('users', 10303, process.env.CD_USERS || 'localhost'),
        new Service('events', 10306, process.env.CD_EVENTS || 'localhost'),
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
