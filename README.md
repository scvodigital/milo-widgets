# Milo Widgets
Search widgets for Milo data

## Instructions
To install
```
npm i
```

To run locally
```
webpack-dev-server
```

To build to `./dist`
```
webpack -p --progress
```

## Configurations
All configurations are stored in `./configurations` and are deployed to Firebase at `/configurations`. To deploy a new one, run:
```
npm run deploy-configurations
```

## Global NPM Requirements
* `typescript@2.1.4`