'use strict';

const baseRepo = 'https://github.com/CoderDojo/';
const map = require('lodash/map');
const forEach = require('lodash/forEach');
const toPlainObject = require('lodash/toPlainObject');

const defaultBranch = 'master';

// set any variables common to all systems here..

module.exports = {
  zen: {
    get services() {
      const self = this;
      const services = [
        {
          base: 'cp-dojos',
          get name() {
            return name(this.base);
          },
          get database() {
            return database(this.base);
          },
          test: {
            name: 'test-dojo-data',
            port: 11301,
            host: process.env.CD_DOJOS || 'localhost',
          },
        },
        {
          base: 'cp-users',
          get name() {
            return name(this.base);
          },
          get database() {
            return database(this.base);
          },
          test: {
            name: 'test-user-data',
            port: 11303,
            host: process.env.CD_USERS || 'localhost',
          },
        },
        {
          base: 'cp-events',
          get name() {
            return name(this.base);
          },
          get database() {
            return database(this.base);
          },
          test: {
            name: 'test-event-data',
            port: 11306,
            host: process.env.CD_EVENTS || 'localhost',
          },
        },
      ];
      // add default getter props to all services if not already overridden
      addGetters(services, self);
      return services;
    },
    // for easy debugging (the getters defined above to no console.log well!)
    stringify() {
      return stringify(this);
    },
  },
};

const name = prefix => `${prefix}-service`;

const database = prefix => {
  const db = process.env.ZENTEST === 'true' ? '-test' : '-development';
  return prefix + db;
};

const stringify = ({ systemBranch, services }) => {
  return {
    systemBranch: systemBranch,
    services    : map(services, toPlainObject),
  };
};

const addGetters = (services, self) => {
  forEach(services, service => {
    if (service.repo === undefined) {
      service.__defineGetter__('repo', () => {
        return baseRepo + service.name;
      });
    }
    const serviceBranch = service.branch;
    if (service.branch === undefined) {
      service.__defineGetter__('branch', () => {
        return serviceBranch || self.systemBranch || defaultBranch;
      });
    }
  });
};
