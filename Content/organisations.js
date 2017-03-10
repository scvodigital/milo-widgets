requirejs.config({
	baseUrl: "https://widgets.scvo.org.uk/lib",
	paths: {
		app: "../organisations",
		handlebars: "handlebars/handlebars",
		jquery: "jquery/dist/jquery",
		text: "text/text"
	},
	packages: [

	],
	shim: {

	},
	urlArgs: "bust=" + (new Date()).getTime()
});
requirejs(["app/main"]);