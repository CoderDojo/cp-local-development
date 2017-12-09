const { isEmpty } = require('lodash');
const { applications, events } = require('cp-test-data').backend;

const hour = amount => amount * 60 * 60 * 1000;

module.exports = seneca => ({
  createEvents() {
    let dojo = {};
    return Promise.all(
      events.map(async event => {
        try {
          const dojos = await seneca.actAsync({
            role: 'cd-dojos',
            cmd: 'list',
            query: { email: event.dojo },
          });
          // Even if we run out of dojos, we can reuse the previous one
          if (!isEmpty(dojos)) dojo = dojos[0];
          const now = new Date();
          event.dojoId = dojo.id;
          now.setDate(now.getDate() + 5);
          event.dates[0].startTime = now.toISOString();
          now.setTime(now.getTime() + hour(3));
          event.dates[0].endTime = now.toISOString();
          delete event.dojo;
          await seneca.actAsync({ role: 'cd-events', cmd: 'saveEvent', eventInfo: event });
        } catch (err) {
          throw err;
        }
      })
    );
  },

  linkEventsUsers() {
    return Promise.all(
      applications.map(async application => {
        try {
          const event = await getEvent(application);
          const ticket = await getTicket(application);
          const user = await getUser(application);
          await saveApplication(event, ticket, user);
        } catch (err) {
          throw err;
        }
      })
    );

    function getEvent(application) {
      return seneca
        .actAsync({
          role: 'cd-events',
          cmd: 'listEvents',
          query: { name: application.eventName },
        })
        .then(eventsLocal => eventsLocal[0]);
    }

    function getTicket(application) {
      return seneca
        .actAsync({
          role: 'cd-events',
          cmd: 'searchTickets',
          query: { name: application.ticketName },
        })
        .then(tickets => tickets[0]);
    }

    function getUser(application) {
      const query = {};
      if (application.userEmail) {
        query.email = application.userEmail;
      } else {
        query.name = application.userName;
      }
      return seneca.actAsync({ role: 'cd-users', cmd: 'list', query }).then(users => users[0]);
    }

    function saveApplication(event, ticket, user) {
      const payload = {
        ticketId: ticket.id,
        eventId: event.id,
        sessionId: ticket.sessionId,
        dojoId: event.dojoId,
        name: user.name,
        dateOfBirth: user.dob,
        userId: user.id,
        ticketName: ticket.name,
        ticketType: ticket.type,
        created: new Date(),
        deleted: false,
        attendance: [],
        notes: 'No Notes',
      };
      return seneca.actAsync({
        role: 'cd-events',
        cmd: 'saveApplication',
        application: payload,
      });
    }
  },
});
