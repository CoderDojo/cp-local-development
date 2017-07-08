const debug = require('debug')('localdev:init');
const { exec } = require('child_process');

const clone = (repo, folder) => new Promise((resolve, reject) => {
  exec(`git clone ${repo} ${folder}`, (error, stdout) => {
    if (error) reject(error);
    resolve(stdout);
  });
});

const chown = (folder, uid, gid) => new Promise((resolve, reject) => {
  exec(`chown -R ${uid}:${gid} ${folder}`, (error, stdout) => {
    if (error) reject(error);
    resolve(stdout);
  });
});

module.exports = systems => new Promise((resolve, reject) => {
  const sysName = 'zen';
  const system = systems[sysName];
  debug(system);
  Promise.all(system.services.map(service => clone(service.repo, `./workspace-zen/${service.name}`)))
    .then(chown('workspace-zen', process.env.PUID || 1000, 1000))
    .then(resolve)
    .catch(reject);
});
