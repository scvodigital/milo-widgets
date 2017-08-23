# Milo widgets [![Build Status](https://travis-ci.org/scvodigital/milo-widgets.svg?branch=master)](https://travis-ci.org/scvodigital/milo-widgets)

[![Dependency Status](https://david-dm.org/scvodigital/milo-widgets/master.svg)](https://david-dm.org/scvodigital/milo-widgets/master) [![devDependency Status](https://david-dm.org/scvodigital/milo-widgets/master/dev-status.svg)](https://david-dm.org/scvodigital/milo-widgets/master?type=dev)

This is the repository for the Get Involved website, it contains the codebase for the public website. Deployment instructions are detailed below.

## Installation
```
git clone https://github.com/scvodigital/milo-widgets
cd milo-widgets
sudo npm i -g typescript firebase-tools
npm i
```

## Run Development Server
```
npm start
```
Navigate to [localhost:9010](http://localhost:9010). The app will automatically reload if you change any of the source files.

## Live Deployment
### CI
There is continuous integration via [Travis](https://travis-ci.org) on `git push` which automatically deploys to [Google Firebase](https://firebase.google.com) CDN hosting.

### Manually
```
npm run deploy
```
This builds minified code and deploys via Firebase.

## Information
The repository [wiki](https://github.com/scvodigital/milo-widgets/wiki) will contain project documentation.

The website address is [milo.scvo.org](https://milo.scvo.org).
* [Documentation](https://github.com/scvodigital/milo-widgets/wiki)
* [Bug tracker](https://github.com/scvodigital/milo-widgets/issues)

## Configurations
All configurations are stored in `./configurations` and are deployed to Firebase at `/configurations`. To deploy a new one, run:
```
npm run deploy-configurations
```
## Global NPM Requirements
* `typescript@2.1.4`
