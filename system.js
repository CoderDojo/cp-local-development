var baseRepo = 'git@github.com:CoderDojo/';
var _ = require('lodash');

var defaultBranch = 'master';

module.exports = {
  'phase1': {
    get services () {
      var self = this;
      var services = [{
        name: 'cp-salesforce-service'
      },{
        name: 'cp-dojos-service'
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
            return './start.sh development service.js'
          });
        }
      });
      return services;
    },
    systemBranch: 'phase1-branch',

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