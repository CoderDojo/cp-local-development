# Community Platform Local Development

Instructions for setting up local development for CoderDojo Community Platform. There are four main parts to setting up your local development environment:

* Install the tools (node.js, PostgreSQL, ElasticSearch, etc)
* Setting up the Community Platform code
* Loading test data into your fresh setup
* Making code changes

## Tools

## Code

## Test Data

## Making code changes

## Documentation

### Environment values

`localdev` has four places where environment variables can be set:

* env vars that are global to all systems, these are read first
* env vars that are system specific, these are read next
* env vars that are service specific, these are read next
* local setup specific variables, these are read last

Settings at any level will override existing settings, so for example anything you set in your local setup will override any previous setting.

See [system.js](system.js) for global, system and service environment variables.

To set local environment variables, do the following:

* create a file called `local-dev.js`. Note this file is in the `.gitignore` so it won't be added to git
* override any variables you want as follows:

```
module.exports = {
  POSTGRES_HOST: '192.168.59.103',
  SALESFORCE_ENABLED: 'false'
}
```
