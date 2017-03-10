define(["jquery", "handlebars"], function ($, Handlebars) {
	Handlebars.registerHelper('xif', function (v1, operator, v2, options) {
		switch (operator) {
			case '==':
				return (v1 == v2) ? options.fn(this) : options.inverse(this);
			case '===':
				return (v1 === v2) ? options.fn(this) : options.inverse(this);
			case '<':
				return (v1 < v2) ? options.fn(this) : options.inverse(this);
			case '<=':
				return (v1 <= v2) ? options.fn(this) : options.inverse(this);
			case '>':
				return (v1 > v2) ? options.fn(this) : options.inverse(this);
			case '>=':
				return (v1 >= v2) ? options.fn(this) : options.inverse(this);
			case '&&':
				return (v1 && v2) ? options.fn(this) : options.inverse(this);
			case '||':
				return (v1 || v2) ? options.fn(this) : options.inverse(this);
			default:
				return options.inverse(this);
		}
	});

	Handlebars.registerHelper('uri', function (uri, protocol) {
		if (!uri) {
			return null;
		}

		protocol = protocol || 'http';
		var suffix = protocol.match(/(^http|ftp|sftp)(.*)$/igm) ? '://' : ':';

		if (uri.indexOf(protocol) != 0) {
			return protocol + suffix + uri
		} else {
			return uri;
		}
	});

	Handlebars.registerHelper('validtel', function (tel, options) {
		return !tel || tel.replace(/[^0-9]/igm, '') == '' ? options.inverse(this) : options.fn(this);
	});

	Handlebars.registerHelper('validpa', function (pa, options) {
		if (!pa || pa.HomeAddress) {
			return options.inverse(this);
		}
		
		var lines = [];
		if (pa.Street) lines.push(pa.Street);
		if (pa.AreaTown) lines.push(pa.AreaTown);
		if (pa.CityCounty) lines.push(pa.CityCounty);
		if (pa.Postcode) lines.push(pa.Postcode);

		return lines.length == 0 ? options.inverse(this) : options.fn(this);
	});

	Handlebars.registerHelper('bootstrap', function (version, options) {
		var loaded = $('link[href*="bootstrap"][href*="' + version + '"]').length > 0;
		return loaded ? options.inverse(this) : options.fn(this);
	});

	Handlebars.registerHelper('pa', function (pa) {
		if(!pa || pa.HomeAddress){
			return null;
		}

		var lines = [];
		if (pa.Street) lines.push(pa.Street);
		if (pa.AreaTown) lines.push(pa.AreaTown);
		if (pa.CityCounty) lines.push(pa.CityCounty);
		if (pa.Postcode) lines.push(pa.Postcode);

		return new Handlebars.SafeString(
			"<addr>" + lines.join(',<br />') + "<addr>"
		);
	});

	Handlebars.registerHelper('ps', function (str) {
		var lines = str.split(/\r\n|\r|\n/gm);
		lines = lines.filter(function (v) { return !v.match(/^[\t\s]*$/) });

		var out = '';
		for (var x = 0; x < lines.length; x++) {
			var curr = lines[x];
			var next = (x + 1 < lines.length) ? lines[x + 1] : '';
			var prev = (x - 1 > 0) ? lines[x - 1] : '';

			var currBullet = isBullet(curr);
			var nextBullet = isBullet(next);
			var prevBullet = isBullet(prev);

			if (!prevBullet && currBullet) { //Starting a list
				out += '<ul><li>' + stripBullet(curr) + '</li>';
			}else if (!nextBullet && currBullet) { //Ending a list
				out += '<li>' + stripBullet(curr) + '</li></ul>';
			}else if (currBullet) { //In a list
				out += '<li>' + stripBullet(curr) + '</li>';
			}else{ //Regular Paragraph
				out += '<p>' + curr + '</p>';
			}
		}

		function isBullet(str){
			return str.match(/(?:^[\s\t]*[.->•*][\s\t]*)(?:.*$)/igm) || false;
		}

		function stripBullet(str) {
			return str.replace(/(^[\s\t]*[.->•*][\s\t]*)/, '');
		}

		return new Handlebars.SafeString(out);
	});

	Handlebars.registerHelper('round', function (number, dp) {
		return number.toFixed(dp);
	});

	Handlebars.registerHelper('picklist', function (picklist, defaultString) {
		var items = picklist.split(';');
		items = items.filter(function (v) { return v });
		if (items.length == 0) {
			return typeof defaultString === 'string' ? defaultString : 'No items selected';
		} else {
			return new Handlebars.SafeString(
				"<ul class='list-unstyled'><li>" + items.join('</li><li>') + "</li></ul>"
			);
		}
	});

	Handlebars.registerHelper('abx', function (bool, a, b, c) {
		switch (typeof bool) {
			case('boolean'):
				return bool ? a : b;
			case('string'):
				bool = bool.toLowerCase();
				var affirmative = ['true', 'yes', 'y', 'aye', 'correct', 'yeah', 'yeh', 'yup', 'right', 'valid', 'success', '1'];
				return affirmative.indexOf(bool) > -1 ? a : b;
			case ('number'):
				return bool === 0 ? b : a;
			default:
				return x || b;
		}
	});

	Handlebars.registerHelper('inc', function (int) {
		return int + 1;
	});

	var returnedModule = function (type) {
		this.uid = Math.floor((Math.random() * 9999) + 1);
		this.scriptTag = $('script[data-main*="' + type + '"]');
		this.html = $('<div />', { 'id': 'scvo-widget-html-' + this.uid }).addClass('scvo-widget-html');
		this.body = $('<div />', { 'id': 'scvo-widget-body-' + this.uid }).addClass('scvo-widget-body').text('Loading... Please wait.');
		this.html.append(this.body).insertAfter(this.scriptTag);
		this.baseUrl = this.scriptTag[0].src.split('/lib')[0] + '/';
		this.libUrl = this.baseUrl + 'lib/';
		this.appUrl = this.baseUrl + type + '/';
		this.apiUrl = 'https://scvo-widgets.azurewebsites.net/search/'; //this.baseUrl.replace(/Content/, 'search'); //

		var $this = this;

		this.renderTemplate = function (templateName, model, container, bindto, callback) {
			container = container || $this.body;
			model = model || {};
			model.Context = this;

			var url = this.appUrl + templateName + "?bust=" + (new Date()).getTime();
			$.get(url, {}, function (template) {
				var compiled = Handlebars.compile(template);
				var output = compiled(model)
				container.html(output);
				
				if (bindto) {
					$this.setupBinding(container, bindto);
				}

				if (callback) {
					callback(true);
				}
			}, 'html').fail(function(response, status, xhr){
				if (callback) {
					callback(false);
				}
			});
		}

		this.setupBinding = function (container, bindto) {
			var submit = container.find('[data-submit]');
			container.find('[data-bind]').each(function (i, o) {
				var _this = $(this);
				var bind = _this.data('bind');
				var type = o.tagName == 'INPUT' ? _this.attr('type') : o.tagName.toLowerCase();
				_this.val(bindto[bind]);
				bindto.watch(bind, function (prop, oldVal, newVal) {
					if (type == 'checkbox') {
						$('[data-bind="' + bind + '"]').prop('checked', newVal);
					} else {
						$('[data-bind="' + bind + '"]').val(newVal);
					}
					return newVal;
				});
				_this.on('keyup change', function (evt) {
					if (type == 'checkbox') {
						var checked = _this.is(':checked');
						if ($.isArray(bindto[bind])) {
							if (checked) {
								bindto[bind].push(_this.val());
							} else {
								bindto[bind].splice(bindto[bind].indexOf(_this.val()), 1)
							}
						} else {
							bindto[bind] = checked;
						}
					} else {
						bindto[bind] = _this.val();
					}
					if (type != 'text' || evt.which == 13) {
						submit.trigger('click');
					}
				});
			});
		}

	};
	return returnedModule;
});

/*
 * object.watch polyfill
 *
 * 2012-04-03
 *
 * By Eli Grey, http://eligrey.com
 * Public Domain.
 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 */

// object.watch
if (!Object.prototype.watch) {
	Object.defineProperty(Object.prototype, "watch", {
		enumerable: false,
		configurable: true,
		writable: false,
		value: function (prop, handler) {
			var
				oldval = this[prop],
				newval = oldval,
				getter = function () {
					return newval;
				},
				setter = function (val) {
					oldval = newval;
					return newval = handler.call(this, prop, oldval, val);
				};

			if (delete this[prop]) { // can't watch constants
				Object.defineProperty(this, prop, {
					get: getter,
					set: setter,
					enumerable: true,
					configurable: true
				});
			}
		}
	});
}

// object.unwatch
if (!Object.prototype.unwatch) {
	Object.defineProperty(Object.prototype, "unwatch", {
		enumerable: false,
		configurable: true,
		writable: false,
		value: function (prop) {
			var val = this[prop];
			delete this[prop]; // remove accessors
			this[prop] = val;
		}
	});
}