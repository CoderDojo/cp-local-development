const { each } = require('lodash');
const { dojos, dojoMembers, dojoleads, polls } = require('cp-test-data').backend;

module.exports = act => ({
  createDojos() {
    let index = 1;
    return Promise.all(
      dojos.map(async (dojo) => {
        try {
          const champions = await act({
            role: 'cd-users',
            cmd: 'list',
            query: { email: `champion${index}@example.com` },
          });
          index += 1;
          const champ = champions[0];
          const lead = await act({
            role: 'cd-dojos',
            entity: 'lead',
            cmd: 'load',
            query: { id: champ.id },
          });
          dojo.dojoLeadId = lead.id;
          // The f-end is supposed to add *isValid* field to each step
          each(lead.application, (step) => {
            step.isValid = true;
          });
          const submittedLead = await act({
            role: 'cd-dojos',
            ctrl: 'lead',
            cmd: 'submit',
            lead,
            user: champ,
            locality: 'en_US',
          });
          await act({
            role: 'cd-dojos',
            ctrl: 'dojo',
            cmd: 'verify',
            verified: 1,
            id: submittedLead.application.dojo.id,
            user: { id: '42' },
          });
        } catch (err) {
          throw err;
        }
      }),
    );
  },

  linkDojoUsers() {
    return Promise.all(
      dojoMembers.map(async (dojoMember) => {
        try {
          const dojo = await getDojo(dojoMember.dojo.email);
          const user = await getUser(dojoMember.email, dojo);
          const membership = await getExistingMembership(dojoMember.existing, dojo, user);
          await saveUserDojo(dojoMember, dojoMember.userTypes, dojo, user, membership);
        } catch (err) {
          throw err;
        }
      }),
    );

    function getDojo(dojoEmail) {
      return act({
        role: 'cd-dojos',
        cmd: 'list',
        query: { email: dojoEmail },
      }).then(dojosLocal => dojosLocal[0]);
    }

    function getUser(userEmail) {
      return act({
        role: 'cd-users',
        cmd: 'list',
        query: { email: userEmail },
      }).then(users => users[0]);
    }

    function getExistingMembership(dojoMemberExists, dojo, user) {
      if (dojoMemberExists) {
        return act({
          role: 'cd-dojos',
          cmd: 'load_usersdojos',
          query: { userId: user.id, dojoId: dojo.id },
        }).then(dojoMembersLocal => dojoMembersLocal[0]);
      }
      return Promise.resolve(null);
    }

    function saveUserDojo(dojoMember, userTypes, dojo, user, membership) {
      let payload = {
        // By default, consider it requires approval
        role: 'cd-dojos',
        cmd: 'request_user_invite',
        data: {
          user,
          dojoId: dojo.id,
          userType: userTypes[0],
          userPermissions: dojoMember.userPermissions,
          emailSubject: 'imabanana',
        },
      };
      if (dojoMember.approved) {
        const userDojo = {
          userId: user.id,
          userTypes,
          dojoId: dojo.id,
          owner: dojoMember.owner,
          userPermissions: dojoMember.userPermissions,
        };
        if (membership) userDojo.id = membership.id;
        payload = {
          role: 'cd-dojos',
          cmd: 'save_usersdojos',
          userDojo,
          user: { roles: ['cdf-admin'] },
        };
      }
      return act(payload);
    }
  },

  createDojoLeads() {
    return Promise.all(
      dojoleads.map(lead =>
        act({ role: 'cd-users', cmd: 'list', query: { email: lead.email } })
          .then((dojoAdmins) => {
            lead.userId = dojoAdmins[0].id;
          })
          .then(
            act({
              role: 'cd-dojos',
              ctrl: 'lead',
              cmd: 'save',
              lead,
              user: { id: lead.userId, email: lead.email },
            }),
          ),
      ),
    );
  },

  createPolls() {
    const newDate = new Date();
    newDate.setMonth(newDate.getMonth() + 3);
    return Promise.all(
      polls.map(async (poll) => {
        try {
          if (!poll.endDate) poll.endDate = newDate;
          await act({ role: 'cd-dojos', cmd: 'save_poll_setup', poll });
        } catch (err) {
          throw err;
        }
      }),
    );
  },
});
