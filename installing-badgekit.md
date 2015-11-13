# Installing badgekit locally

Zen uses [Mozilla Open Badges](http://badgekit.openbadges.org/) to display badges on users profiles.

To install badgekit, [follow the instructions on this repository](https://github.com/mozilla/openbadges-badgekit/wiki/BadgeKit-Self-Hosting-Guide).

Once you have followed the above instructions, you'll need the environment variable BADGEKIT_API_SECRET to be set. In the example above it is "yoursecret". e.g. `BADGEKIT_API_SECRET=yoursecret ./localdev.js run zen`

Once setup you can go to the badges url, which is usually `http://localhost:3000` (or whatever `PERSONA_AUDIENCE` is set to in the badges environment file). Here you can publish badges.

## Publishing badges

* Please note that once badges are published they cannot be deleted unless you delete them from the badgekit api database.
* Zen interacts with Mozilla badges through the "tags" field on the "options" tab. There are three categories, "programming", "soft-skills" and "events". You'll need to add one of these tags to your badge to have it show up there. You can add a second tag e.g. "CSS" to have your badge show up in a separate section under each tab.

## Awarding badges

There are two ways to get a badge on your profile:

* Anyone with "Dojo Admin" permissions on a Dojo can award a badge. Go My Dojos > Manage Users to award a badge by user.
* Via the code claim box on the badges tab. The code claim code must be added to the "tags" field. The claim code must be prepended by "code-" e.g. if the code was "coderdojo", then the tag would be "code-coderdojo".

## Troubleshooting
* I am getting this error: `TypeError: secret must be a string or buffer`
  * Make sure the access list environment variable is set correctly, e.g.
  `export ACCESS_LIST=[\"\^test@example.com\$\"]`

* I am getting a connection error
 * If you recently updated your environment config, make sure you run `source env_local` again before restarting badgekit
 * Make sure you are running `foreman start` in both the `bagekit-api` and `openbadges-badgekit` directories
 * Make sure your API url is set to `localhost:8080`. The badges service expects you to have badgekit set up on this port. In the API environment file, this is the "PORT" variable, and in the badgekit environment file, this is the "OPENBADGER_URL" variable. 
 * If you get `Error: connect ECONNREFUSED` this usually means badgekit is having an issue connecting to your MySQL database. Make sure MySQL is turned on on your machine.

### Further debugging

* If you need to further debug your own setup we suggest adding `export DEBUG=*` to the end of your environment file. This displays errors on the webpage itself.

