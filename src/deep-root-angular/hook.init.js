'use strict';

/*eslint global-require: 0 */

var utils = require('./utils');

module.exports = function(callback) {
  var spawn = require('child_process').spawn;
  var path = require('path');
  var installation = null;
  var bashBin = process.env.SHELL || 'bash';

  if (!/bash/i.test(bashBin)) {
    bashBin = 'bash';
  }

  try {
    installation = spawn(
      bashBin, [
        path.join(__dirname, 'framework.sh'),
      ]
    );
  } catch (error) {
    console.error(error);
    return;
  }

  installation.stdout.pipe(process.stdout);
  installation.stderr.pipe(process.stderr);

  installation.on('error', function(error) {
    console.error(error);
  });

  let installationPromise = new Promise((resolve) => {
    installation.on('close', function(code) {
      if (code !== 0) {
        console.error('Framework installation failed (exit with code ' + code + ')');
      }

      resolve();
    });
  });

  let directory = this.microservice.autoload.frontend.replace(/(\/_build)$/, '');

  installationPromise.then(() => utils.initializeApplication.call(this, directory))
    .then(callback)
    .catch((error) => {
      console.error(error);
      callback();
    });
};
