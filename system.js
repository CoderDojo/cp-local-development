var baseRepo = 'git@github.com:CoderDojo/';
var _ = require('lodash');

var defaultBranch = 'master';

// set any variables common to all systems here..
function setGlobalEnv() {
  process.env.POSTGRES_USERNAME='platform';
  process.env.POSTGRES_PASSWORD='QdYx3D5y'
  process.env.SALESFORCE_ENABLED='false';

  process.env.MAIL_HOST='mailtrap.io';
  process.env.MAIL_PORT='2525';
  process.env.MAIL_USER='3549359982ed10489';
  process.env.MAIL_PASS='979ef86b786a46';

  // TODO - for local dev there will be some cases
  // where we want to source some form of private env
  // that can override any of these variables, e.g.
  // if (privateEnvFile()) setPrivateEnv();
}

module.exports = {
  'phase1': {
    systemBranch: 'phase1-branch',
    setSystemEnv: function() {
      setGlobalEnv();
      // put any system specific env vars here
    },
    get services () {
      var self = this;
      var services = [{
        name: 'cp-salesforce-service',
      },{
        name: 'cp-dojos-service',
        setEnv: function() {
          // service specific env vars
          process.env.POSTGRES_NAME='cp-dojos-development';
          process.env.ES_INDEX='cp-dojos-development';
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

  },
  master: {

  }

}