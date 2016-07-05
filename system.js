var baseRepo = 'https://github.com/CoderDojo/';
var _ = require('lodash');

var defaultBranch = 'master';

// set any variables common to all systems here..
var globalEnv = {
  POSTGRES_USERNAME: 'platform',
  POSTGRES_PASSWORD: 'QdYx3D5y',
  POSTGRES_HOST: 'localhost',
  POSTGRES_PORT: 5432,
  MAILTRAP_ENABLED: 'true',
  SALESFORCE_ENABLED: 'false',
  MAIL_HOST: 'mailtrap.io',
  MAIL_PORT: '2525',
  MAIL_USER: '397746d4abc52902b',
  MAIL_PASS: '0383c445ef22d4',
  GOOGLE_API_ENABLED: 'false',
  GOOGLE_MAPS_KEY: 'AIzaSyC3xF9XV91bS2R14Gjmx3UQaKbGgAfHbE4',
  CDF_ADMINS: 'manager@example.com,admin@example.com'
};

module.exports = {
  zen: {
    systemBranch: 'master',
    systemEnv: {
      // put any system specific env vars here
    },
    get services () {
      var self = this;
      var services = [{
        name: 'cp-salesforce-service'
      }, {
        name: 'cp-dojos-service',
        database: 'cp-dojos-development',
        testdata: './scripts/load_test_data.sh empty',
        get serviceEnv () {
          return {
            POSTGRES_NAME: this.database
          };
        }
      }, {
        name: 'cp-users-service',
        database: 'cp-users-development',
        testdata: './scripts/load_test_data.sh empty',
        get serviceEnv () {
          return {
            POSTGRES_NAME: this.database,
            RECAPTCHA_SECRET_KEY: '6LfVKQgTAAAAAI3dhMSRsrTbFbx7cnGr4Fy2sn5_'
          };
        }
      }, {
        name: 'cp-events-service',
        database: 'cp-events-development',
        get serviceEnv () {
          return {
            // put any service specific env vars here
            POSTGRES_NAME: this.database
          };
        }
      }, {
        name: 'cp-badges-service'
      }, {
        name: 'cp-zen-platform',
        ignored: ['web/.build']
      }, {
        name: 'cp-e2e-tests',
        start: null
      }];

      // add default getter props to all services if not already overridden
      addGetters(services, self);
      return services;
    },
    // for easy debugging (the getters defined above to no console.log well!)
    stringify: function () {
      return stringify(this);
    },

    // system env getter, amalgamated with the global env
    get env () {
      return env(this);
    }
  }
};

var stringify = function (system) {
  return {
    systemBranch: system.systemBranch,
    services: _.map(system.services, _.toPlainObject)
  };
};

var env = function (system) {
  var evars = _.clone(globalEnv);
  _.each(system.systemEnv, function (v, k) {
    evars[k] = v;
  });
  return evars;
};

var addGetters = function (services, self) {
  _.each(services, function (service) {
    if (service.repo === undefined) {
      service.__defineGetter__('repo', function () {
        return baseRepo + service.name;
      });
    }
    var serviceBranch = service.branch;
    if (service.branch === undefined) {
      service.__defineGetter__('branch', function () {
        return serviceBranch || self.systemBranch || defaultBranch;
      });
    }

    // most services have the same start command
    if (service.start === undefined) {
      service.__defineGetter__('start', function () {
        return 'node ./service.js';
      });
    }

    // env function returns the amalgamated environement variables
    service.__defineGetter__('env', function () {
      var evars = _.clone(self.env);
      _.each(service.serviceEnv, function (v, k) {
        evars[k] = v;
      });

      // see if user has anything to override
      try {
        var localenv = require('./local-env.js');
        _.each(localenv, function (v, k) {
          evars[k] = v;
        });
      }catch (x) {
        // purposely ignored
      }
      return evars;
    });
  });
};
