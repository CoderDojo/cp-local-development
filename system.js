var baseRepo = 'git@github.com:CoderDojo/';
var _ = require('lodash');

var defaultBranch = 'master';

// set any variables common to all systems here..
var globalEnv = {
  POSTGRES_USERNAME: 'platform',
  POSTGRES_PASSWORD: 'QdYx3D5y',
  POSTGRES_HOST: 'localhost',
  ES_HOST: 'localhost',
  SALESFORCE_ENABLED: 'false',
  MAIL_HOST: 'mailtrap.io',
  MAIL_PORT: '2525',
  MAIL_USER: '3549359982ed10489',
  MAIL_PASS: '979ef86b786a46'
};

module.exports = {
  'phase1': {
    systemBranch: 'phase1-branch',
    systemEnv: {
      // put any system specific env vars here
    },
    get services () {
      var self = this;
      var services = [{
        name: 'cp-salesforce-service',
        serviceEnv: {
          SALESFORCE_URL: 'https://test.salesforce.com',
          SALESFORCE_USERNAME: 'damian.beresford@nearform.com',
          SALESFORCE_PASSWORD: 'Password123BDQSt3Yk3Uf18L6nRAwRsM4gH',
        }
      },{
        name: 'cp-dojos-service',
        database: 'phase1-cp-dojos-development',
        testdata: './scripts/load_test_data.sh empty',
        get serviceEnv () {
          return {
            // put any service specific env vars here
          POSTGRES_NAME: this.database,
          ES_INDEX: this.database
          }
        }
      },{
        name: 'cp-countries-service',
        database: 'phase1-cp-countries-development',
        testdata: './scripts/load_test_data.sh empty',
        get serviceEnv () {
          return {
            // put any service specific env vars here
            POSTGRES_NAME: this.database,
            ES_INDEX: this.database
          }
        }
      },{
        name: 'cp-users-service',
        database: 'phase1-cp-users-development',
        testdata: './scripts/load_test_data.sh empty',
        get serviceEnv () {
          return {
            // put any service specific env vars here
            POSTGRES_NAME: this.database,
            ES_INDEX: this.database,
            RECAPTCHA_SECRET_KEY:'6LfVKQgTAAAAAI3dhMSRsrTbFbx7cnGr4Fy2sn5_'
          }
        }
      },{
        name: 'cp-zen-platform',
        ignored: ['web/.build'],
        start: './start.sh empty web/index.js'
      }];

      // add default getter props to all services if not already overridden
      _.each(services, function (service) {
        if (!service.repo) {
          service.__defineGetter__('repo', function() {
            return baseRepo + service.name;
          });
        }
        var serviceBranch = service.branch;
        if (!service.branch) {
          service.__defineGetter__('branch', function() {
            return serviceBranch || self.systemBranch || defaultBranch;
          });
        }

        // most services have the same start command
        if (!service.start) {
          service.__defineGetter__('start', function() {
            return './start.sh empty service.js'
          });
        }

        // env function returns the amalgamated environement variables
        service.__defineGetter__('env', function() {
          var evars = _.clone(self.env);
          _.each(service.serviceEnv, function(v,k) {
            evars[k] = v;
          });

          // see if user has anything to override
          try {
            var localenv = require('./local-env.js');
            _.each(localenv, function(v,k) {
              evars[k] = v;
            });
          }catch(x) {
            // purposely ignored
          }
          return evars;
        });
      });
      return services;
    },

    // for easy debugging (the getters defined above to no console.log well!)
    stringify: function() {
      return {
        systemBranch: this.systemBranch,
        services: _.map(this.services, _.toPlainObject)
      };
    },

    // system env getter, amalgamated with the global env
    get env () {
      var evars = _.clone(globalEnv);
      _.each(this.systemEnv, function(v,k) {
        evars[k] = v;
      });
      return evars;
    }
  },
  phase3: {

  }

}