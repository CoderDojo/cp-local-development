'use strict';

const baseRepo = 'https://github.com/CoderDojo/';
const _ = require('lodash');

const defaultBranch = 'master';

// set any variables common to all systems here..
const globalEnv = {
  POSTGRES_USERNAME : 'platform',
  POSTGRES_PASSWORD : 'QdYx3D5y',
  POSTGRES_HOST     : 'localhost',
  POSTGRES_PORT     : 5432,
  MAILTRAP_ENABLED  : 'true',
  SALESFORCE_ENABLED: 'false',
  MAIL_HOST         : 'mailtrap.io',
  MAIL_PORT         : '2525',
  MAIL_USER         : '397746d4abc52902b',
  MAIL_PASS         : '0383c445ef22d4',
  GOOGLE_API_ENABLED: 'false',
  GOOGLE_MAPS_KEY   : 'AIzaSyC3xF9XV91bS2R14Gjmx3UQaKbGgAfHbE4',
  CDF_ADMINS        : 'manager1@example.com,admin@example.com',
};

module.exports = {
  zen: {
    systemBranch: 'master',
    systemEnv   : {
      // put any system specific env vars here
    },
    get services() {
      const self = this;
      const services = [
        {
          name: 'cp-salesforce-service',
        },
        {
          base: 'cp-dojos',
          get name() {
            return name(this.base);
          },
          get database() {
            return database(this.base);
          },
          broadcast: true,
          test     : {
            name: 'test-dojo-data',
            port: 11301,
            host: process.env.CD_DOJOS || 'localhost',
          },
          get serviceEnv() {
            return {
              POSTGRES_NAME: this.database,
            };
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
          broadcast: true,
          test     : {
            name: 'test-user-data',
            port: 11303,
            host: process.env.CD_USERS || 'localhost',
          },
          get serviceEnv() {
            return {
              POSTGRES_NAME       : this.database,
              RECAPTCHA_SECRET_KEY: '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe',
            };
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
          broadcast: true,
          test     : {
            name: 'test-event-data',
            port: 11306,
            host: process.env.CD_EVENTS || 'localhost',
          },
          get serviceEnv() {
            return {
              // put any service specific env vars here
              POSTGRES_NAME: this.database,
            };
          },
        },
        {
          name: 'cp-badges-service',
        },
        {
          name   : 'cp-zen-platform',
          ignored: ['web/.build'],
        },
        {
          name : 'cp-e2e-tests',
          start: null,
        },
        {
          name : 'cp-translations',
          start: null,
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

    // system env getter, amalgamated with the global env
    get env() {
      return env(this);
    },
  },
};

const name = prefix => {
  return `${prefix}-service`;
};

const database = prefix => {
  const db = process.env.ZENTEST === 'true' ? '-test' : '-development';
  return prefix + db;
};

const stringify = ({ systemBranch, services }) => {
  return {
    systemBranch: systemBranch,
    services    : _.map(services, _.toPlainObject),
  };
};

const env = ({ systemEnv }) => {
  const evars = _.clone(globalEnv);
  _.each(systemEnv, (v, k) => {
    evars[k] = v;
  });
  return evars;
};

const addGetters = (services, self) => {
  _.each(services, service => {
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

    // most services have the same start command
    if (service.start === undefined) {
      service.__defineGetter__('start', () => {
        return 'npm start';
      });
    }

    // env function returns the amalgamated environement variables
    service.__defineGetter__('env', () => {
      const evars = _.clone(self.env);
      _.each(service.serviceEnv, (v, k) => {
        evars[k] = v;
      });

      // see if user has anything to override
      try {
        const localenv = require('./local-env.js');
        _.each(localenv, (v, k) => {
          evars[k] = v;
        });
      } catch (x) {
        // purposely ignored
      }
      return evars;
    });
  });
};
