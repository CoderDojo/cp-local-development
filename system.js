var baseRepo = 'git@github.com:CoderDojo/';
var _ = require('lodash');

var defaultBranch = 'master';

// set any variables common to all systems here..
// TODO - for local dev there will be some cases
// where we want to source some form of private env
// that can override any of these variables, e.g.
// if (privateEnvFile()) setPrivateEnv();

var globalEnv = {
  POSTGRES_USERNAME: 'platform',
  POSTGRES_PASSWORD: 'QdYx3D5y',
  POSTGRES_HOST: '192.168.59.103', // TODO - using docker postgres for now
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
  master: {

  }

}