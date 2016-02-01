# Troubleshooting local development

## General

### Something seems to have failed mid install, what do I do?

This can often be due to a connection issue with Github - please try reinstalling:

* In the cp-local-development directory, delete the workspace-zen directory and try running init again, as follows:
 * `cp-local-development$ rm -rf workspace-zen`
 * `./localdev.js init zen`

### I'm getting an error related to a bower component/module in cp-zen-platform
* Make sure you have Grunt installed globally `npm install -g grunt`.
* Try reinstalling the bower components, as follows:
 * `cp-local-development/workspace-zen/cp-zen-platform/web/public$ rm -rf components`
 * Then up one directory: `cp-local-development/workspace-zen/cp-zen-platform/web$ bower install`
* If you get an error about a particular module you can install it manually, e.g. `cp-local-development/workspace-zen/cp-zen-platform/web$ bower install angular-bootstrap#0.13.2`

## Linux 

* "Cube", "uuid-ossp", or other PostgreSQL extensions may be installed together with PostgreSQL, if not, [you have to install it yourself](http://askubuntu.com/a/354709).
```
 # On Ubuntu/Debian/Mint
 $ sudo apt-get install postgresql-contrib
 # On Fedora/CentOs
 $ sudo yum install postgresql-contrib
```

## Mac
* If you are running a Mac you will need to have xcode installed. You can install this via the app store on OSX.
* If you come across the error: ```env: node\r: No such file or directory``` when running ```./localdev.js```, you need to make sure the file ending for ```./localdev.js``` is in Unix ending. You may also run into similar problem when loading test data later using ```./localdev.js testdata zen```. If that happens, make sure all the ```exec_on_env.sh``` and ```load_test_data.sh``` files under the project are in Unix ending before running ```./localdev.js testdata zen```. 
* If you get env: node: No such file or directory while running ```./localdev.js testdata zen```, it can also be caused if the node alias was never set during installation. You will need to run ```nvm alias default 0.x.x``` after installing node, so the shell will remember the node env.

- - - -

Please get in touch with the Foundation at info@coderdojo.org if you are having issues that this document cannot assist with.

If you come across an issue that has not been included in this doc, we'd love to see a pull request from you to keep the documentation as informed as possible!
