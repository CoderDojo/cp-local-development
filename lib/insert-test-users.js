const { filter } = require('lodash');
const { children, users } = require('cp-test-data').backend;

module.exports = act => ({
  createUsers() {
    return createIndependants().then(createDependantsChildren);

    function createIndependants() {
      return Promise.all(
        users.map(user =>
          act(user, { role: 'cd-users', cmd: 'register' }).then((response) => {
            if (response.ok === false) throw response;
            return response;
          }),
        ),
      );
    }

    function createDependantsChildren() {
      return Promise.all(
        children.map(child => getParent(child).then(parent => saveChild(child, parent))),
      );
    }

    function getParent(child) {
      return act({
        role: 'cd-users',
        cmd: 'list',
        query: { email: child.parentEmail },
      }).then(parents => parents[0]);
    }

    function saveChild(child, parent) {
      child.parents = [parent.userId];
      return act({
        role: 'cd-profiles',
        cmd: 'save-youth-profile',
        profile: child.data,
        user: parent,
      }).then((savedChild) => {
        if (savedChild.ok === false) throw savedChild;
        return savedChild;
      });
    }
  },

  createAgreements() {
    const champs = filter(users, user => user.user.email.includes('champion'));
    return Promise.all(
      champs.map(champ =>
        act({
          role: 'cd-users',
          cmd: 'list',
          query: { email: champ.user.email },
        })
          .then(champsLocal => champsLocal[0])
          .then(user =>
            act({
              role: 'cd-agreements',
              cmd: 'save',
              agreement: { fullName: user.name },
              user,
            }),
          )
          .then((response) => {
            if (response.ok === false) throw response;
            return response;
          }),
      ),
    );
  },
});
