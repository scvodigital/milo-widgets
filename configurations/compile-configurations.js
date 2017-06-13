const fs = require('fs')
const path = require('path')

var configurationNames = fs.readdirSync(__dirname).filter(file => fs.lstatSync(path.join(__dirname, file)).isDirectory());
var configurations = {};
configurationNames.forEach((name) => {
    var base = path.join(__dirname, name);

    var configJson = fs.readFileSync(base + '/config.json');
    var config = JSON.parse(configJson);

    config.templateSet.infoWindowTemplate = fs.readFileSync(base + '/infowindow.hbs').toString('utf8');
    config.templateSet.resultsTemplate = fs.readFileSync(base + '/results.hbs').toString('utf8');
    config.templateSet.searchFormTemplate = fs.readFileSync(base + '/search.hbs').toString('utf8');
    config.templateSet.viewTemplate = fs.readFileSync(base + '/view.hbs').toString('utf8');

    configurations[name] = config;
});

var configurationsJson = JSON.stringify(configurations, null, 4);
fs.writeFileSync(path.join(__dirname, 'configurations.json'), configurationsJson);

