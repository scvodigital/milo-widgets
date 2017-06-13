import * as jq from 'jquery';
import * as elasticsearch from 'elasticsearch';
import * as handlebars from 'handlebars';
import * as helpers from 'handlebars-helpers';
import * as s from 'string';
import * as GoogleMapsLoader from 'google-maps';
import 'core-js';

import * as BaseTemplate from '../templates/base.hbs';
import * as NavigationTemplate from '../templates/navigation.hbs';
import '../styles/main.scss';

helpers({ handlebars: handlebars });
handlebars.registerPartial('navigation', NavigationTemplate);

export class BaseWidget {
	protected config: WidgetConfiguration = null;

	protected scriptTag;
	protected widgetElement;
	protected searchElement;
	protected bodyElement;
	protected mapElement;

	protected resultSet: any = null;
	private terms: ITermCollection;
	protected hideMap: boolean = false;
	protected map: google.maps.Map;
	protected markers: google.maps.Marker[] = [];
	protected infoWindows: google.maps.InfoWindow[] = [];
	protected doc: any;

	private _client: elasticsearch.Client = null;
	protected get client(): elasticsearch.Client {
		if (this._client === null) {
			this._client = new elasticsearch.Client({
				host: 'https://readonly:onlyread@4c19757a0460c764d6e4712b0190cc21.eu-west-1.aws.found.io:443',
				apiVersion: '2.4',
				//log: 'trace'
			});
		}
		return this._client;
	}

	constructor(name: string) {
		this.scriptTag = jq('script[src*="' + name + '.bundle.js"]');

		if(this.scriptTag.data('widget')){
			name = this.scriptTag.data('widget');
		}

		this.widgetElement = jq('<div>Loading...</div>').addClass('mw-search-widget').attr('id', 'mw-' + name + '-widget').insertAfter(this.scriptTag);
		jq.getJSON('https://scvo-widgets-9d094.firebaseio.com/configurations/' + name + '.json').then((configuration) => {
			this.config = new WidgetConfiguration(configuration);

			this.hideMap = this.scriptTag.data('hide-map') || false;

			(<any>GoogleMapsLoader)['KEY'] = 'AIzaSyBGANoz_QO2iBbM-j1LIvkdaH6ZKnqgTfA';
			(<any>GoogleMapsLoader)['LIBRARIES'] = ['geometry', 'places'];

			this.setupControls();
			window.addEventListener('popstate', () => { this.hashChange(true); }, false);
		});
	}

	hashChange(jump: boolean = false) {
		var hash = window.location.hash.replace(/\#/, '');
		var prefix = 'mw-' + this.config.name + '-';
		if (hash.indexOf(prefix) === 0) {
			var id = hash.substr(prefix.length);
			if (id !== 'top') {
				this.one(id).then((doc) => { });
			} else if (this.resultSet) {
				this.renderResults();
			}
		}
	}

	setupControls() {
		this.loadTerms().then(() => {
			var baseHtml = BaseTemplate(this.config);
			var searchHtml = this.config.templateSet.searchForm({ terms: this.terms });

			this.widgetElement.html(baseHtml);
			this.searchElement = this.widgetElement.find('.mw-search-form');
			this.bodyElement = this.widgetElement.find('.mw-body');
			this.mapElement = this.widgetElement.find('.mw-map');

			this.searchElement.html(searchHtml);

			this.setupMap().then(() => {
				this.updateBody('');
				this.hashChange();
			});
		}).catch((err) => {
			console.error('Failed to get terms', err);
		});
	}

	bindControls() {
		jq('#mw-' + this.config.name + '-search-button').off('click').on('click', () => {
			this.doSearch(1);
			window.location.hash = 'mw-' + this.config.name + '-top';
		});

		this.widgetElement.find('.mw-back-to-results').off('click').on('click', () => {
			this.renderResults(true);
			window.location.hash = 'mw-' + this.config.name + '-top';
		});

		this.widgetElement.find('.mw-previous, .mw-next').off('click').on('click', (e) => {
			var page = jq(e.currentTarget).data('page');
			this.doSearch(page, true);
		});

		this.searchElement.find('input').off('keyup').on('keyup', (e) => {
			if (e.which === 13) {
				this.doSearch(1);
			}
		});
	}

	protected loadTerms() {
		return new Promise<void>((resolve, reject) => {
			var payload = {
				index: this.config.index,
				type: this.config.type,
				size: 0,
				body: {
					aggs: {}
				}
			};

			this.config.termFields.forEach((field) => {
				payload.body.aggs[field] = {
					terms: {
						field: field,
						size: 0
					}
				}
			});

			this.runQuery(payload).then((results) => {
				var aggs = results.aggregations;
				var terms = {};
				this.config.termFields.forEach((field) => {
					terms[field] = aggs[field].buckets.map((term) => new Term(term.key, term.doc_count));
				});
				this.terms = terms;
				resolve();
			}).catch((err) => {
				reject(err);
			})
		});
	}

	doSearch(page: number = 1, jump: boolean = false) {
		this.getGeo().then((geo: IGeoQuery) => {
			var terms: ITermQuery[] = this.getTerms();
			var ranges: IRangeQuery[] = this.getRanges();
			var query: IQueryQuery = this.getQuery();

			var payload: any = {
				bool: {
					must: []
				}
			}

			payload.bool.must = payload.bool.must.concat(terms);
			payload.bool.must = payload.bool.must.concat(ranges);

			if (geo) {
				payload.bool.must.push(geo.query);
				payload.sort = geo.sort;
			}

			if (query) {
				payload.bool.must.push(query);
			}

			this.search(payload, page, jump).then((resultSet: ResultSet) => { });
		});
	}

	private getQuery(): IQueryQuery {
		var queryString = this.widgetElement.find('[data-query]').val() || null;
		if (!queryString) {
			return null;
		} else {
			var query: IQueryQuery = {
				simple_query_string: {
					query: queryString,
					analyzer: "snowball"
				}
			};
			return query;
		}
	}

	private getGeo(): Promise<IGeoQuery> {
		return new Promise<IGeoQuery>((resolve, reject) => {
			var postcodeElement = this.widgetElement.find('[data-geo]');
			var postcode = postcodeElement.val() || null;
			var distanceElement = this.widgetElement.find('[data-geo-distance]');
			var distance = distanceElement.val() || null;
			var unit = distanceElement.data('geo-unit') || 'mi';
			if (!postcode || !distance) {
				return resolve(null);
			}

			jq.getJSON(window.location.protocol + '//api.postcodes.io/postcodes/' + postcode, (result) => {
				if (result.status === 200) {
					var field = postcodeElement.data('geo');

					var geo = {
						query: {
							geo_distance_range: {
								lt: distance + unit,
								field: field,
								[field]: {
									lat: result.result.latitude,
									lon: result.result.longitude
								}
							}
						},
						sort: {
							_geo_distance: {
								[field]: {
									lat: result.result.latitude,
									lon: result.result.longitude
								},
								order: 'asc',
								unit: unit,
								distance_type: 'arc'
							}
						}
					};

					resolve(geo);
				} else {
					resolve(null);
				}
			});
		});
	}

	private getTerms(): ITermQuery[] {
		var termFields = this.widgetElement.find('[data-term]');
		var must: ITermQuery[] = [];

		var terms: { [term: string]: string[] } = {};
		termFields.each((i, o) => {
			var term = jq(o).data('term');
			if (jq(o).val()) {
				if (!terms.hasOwnProperty(term)) {
					terms[term] = [];
				}
				var value = jq(o).val();
				if (Array.isArray(value)) {
					terms[term] = terms[term].concat(value);
				} else {
					terms[term].push(value);
				}
			}
		});

		Object.keys(terms).forEach((key) => {
			var term = {
				terms: { [key]: terms[key] }
			};
			must.push(term);
		});

		return must;
	}

	private getRanges(): IRangeQuery[] {
		var rangeFields = this.widgetElement.find('[data-range]');
		var must: IRangeQuery[] = [];

		var ranges: { [field: string]: { [operation: string]: string } } = {};
		rangeFields.each((o) => {
			var field = jq(o).data('range');
			var operator = jq(o).data('operator');
			if (!ranges.hasOwnProperty(field)) {
				ranges[field] = {};
			}
			ranges[field][operator] = jq(o).val();
		});

		Object.keys(ranges).forEach((field) => {
			var range = {
				range: {
					[field]: ranges[field]
				}
			};
			must.push(range);
		})

		return must;
	}

	protected runQuery(query) {
		return new Promise<any>((resolve, reject) => {
			this.client.search(query, (err, results) => {
				if (err) {
					console.error(err);
					reject(err);
					return;
				}
				resolve(results);
			});
		})
	}

	protected one(id: string) {
		return new Promise((resolve, reject) => {
			var payload: elasticsearch.GetParams = {
				id: id,
				index: this.config.index,
				type: this.config.type
			};

			this.client.get(payload).then((response: elasticsearch.GetResponse<any>) => {
				if (response.found) {
					this.doc = response._source;
					this.doc.resultSet = this.resultSet;
					var viewHtml = this.config.templateSet.view(this.doc, handlebars);
					this.updateBody(viewHtml, true);
					resolve(this.doc);
				} else {
					reject(new Error('Document not found'));
				}
			});
		});
	}

	protected updateBody(html: string, jump: boolean = false) {
		this.bodyElement.html(html);
		if (this.resultSet) {
			this.widgetElement.find('.mw-navigation').show();
			if (this.doc) {
				this.widgetElement.find('.mw-paging').hide();
				this.widgetElement.find('.mw-back-to-results').show();
			} else {
				this.widgetElement.find('.mw-paging').show();
				this.widgetElement.find('.mw-back-to-results').hide();

				this.widgetElement.find('.mw-previous')
					.prop('disabled', this.resultSet.currentPage === 1)
					.data('page', this.resultSet.currentPage - 1);
				this.widgetElement.find('.mw-next')
					.prop('disabled', this.resultSet.currentPage === this.resultSet.totalPages)
					.data('page', parseInt(this.resultSet.currentPage) + 1);
			}
		} else {
			this.widgetElement.find('.mw-paging').hide();
			this.widgetElement.find('.mw-back-to-results').hide();
			this.widgetElement.find('.mw-navigation').hide();
		}

		this.bindControls();
		this.placeMarkers();

		if (jump) {
			var topElement = this.widgetElement.find('[name="mw-' + this.config.name + '-top"]');
			var top = topElement.offset().top;
			window.scroll(0, top);
		}
	}

	protected search(query, page = 1, jump: boolean = false) {
		return new Promise((resolve, reject) => {
			var from = (page - 1) * 10;
			var payload: any = {
				index: this.config.index,
				type: this.config.index,
				body: {
					query: query,
					from: from
				}
			};

			if (payload.body.query.hasOwnProperty('sort')) {
				payload.body.sort = payload.body.query.sort;
				delete payload.body.query.sort;
			}

			this.runQuery(payload).then((response) => {
				var resultSet: ResultSet = new ResultSet(
					response.hits.total,
					response.hits.hits.map((hit) => hit._source),
					page);
				this.resultSet = resultSet;
				this.renderResults(jump);
				resolve(resultSet);
			}).catch((err) => {
				console.error('Failed to search', err);
				reject(err);
			});
		});
	}

	renderResults(jump: boolean = false) {
		var resultsHtml = this.config.templateSet.results(this.resultSet || [], handlebars);
		this.doc = null;
		this.updateBody(resultsHtml, jump);
	}

	placeMarkers() {
		if (!this.hideMap) {
			this.markers.forEach((marker: google.maps.Marker) => {
				marker.setMap(null);
			});
			this.markers = [];
			this.infoWindows.forEach((infoWindow: google.maps.InfoWindow) => {
				infoWindow.close();
				infoWindow = null;
			});
			this.infoWindows = [];

			if (this.doc) {
				this.mapElement.hide();
				this.map.setCenter(this.config.mapOptions.initialLocation);
				this.map.setZoom(this.config.mapOptions.initialZoom);
				return;
			}

			var bounds = new google.maps.LatLngBounds();
			var items = this.resultSet ? this.resultSet.results : [];

			items.forEach((result) => {
				var lat = this.propertyByString(result, this.config.mapOptions.fields.lat) || false;
				var lng = this.propertyByString(result, this.config.mapOptions.fields.lng) || false;
				if (lat && lng) {
					var coords = { lat: lat, lng: lng };
					var infoWindow = new google.maps.InfoWindow({
						content: this.config.templateSet.infoWindow(result, handlebars)
					});
					var marker = new google.maps.Marker({
						position: coords,
						map: this.map,
						title: result.name
					});
					marker.addListener('click', () => {
						this.infoWindows.forEach((infoWindow) => {
							infoWindow.close();
						})
						infoWindow.open(this.map, marker);
					});
					bounds.extend(coords);
					this.markers.push(marker);
				}
			});
			if (this.markers.length === 0) {
				this.mapElement.hide();
				this.map.setCenter(this.config.mapOptions.initialLocation);
				this.map.setZoom(this.config.mapOptions.initialZoom);
			} else {
				this.mapElement.show();
				this.map.fitBounds(bounds);
				google.maps.event.trigger(this.map, 'resize')
			}
		}
	}

	setupMap() {
		return new Promise((resolve, reject) => {
			if (!this.hideMap) {
				if (!this.map) {
					GoogleMapsLoader.load((google) => {
						var element = this.mapElement[0];
						this.map = new google.maps.Map(element, {
							zoom: this.config.mapOptions.initialZoom,
							center: this.config.mapOptions.initialLocation,
							draggable: !("ontouchend" in document)
						});
						resolve();
					});
				}
			} else {
				resolve();
			}
		});
	}

	propertyByString(o, s) {
		s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
		s = s.replace(/^\./, '');           // strip a leading dot
		var a = s.split('.');
		for (var i = 0, n = a.length; i < n; ++i) {
			var k = a[i];
			if (o && k in o) {
				o = o[k];
			} else {
				return;
			}
		}
		return o;
	}
}

export interface IWidgetConfiguration {
	index: string;
	type: string;
	termFields: string[];
	templateSet: TemplateSet;
	mapOptions: MapOptions;
	name: string;
	title: string;
}

export class WidgetConfiguration implements IWidgetConfiguration {
	index: string = null;
	type: string = null;
	termFields: string[] = null;
	templateSet: TemplateSet = null;
	mapOptions: MapOptions = null;
	name: string = null;
	title: string = null;

	constructor(widgetConfiguration?: IWidgetConfiguration) {
		if (widgetConfiguration) {
			Object.assign(this, widgetConfiguration);
			this.templateSet = new TemplateSet(this.templateSet);
			this.mapOptions = new MapOptions(this.mapOptions);
		}
	}
}

export interface IResultSet {
	total: number;
	results: any[];
	currentPage: number;
	totalPages: number;
}

export class ResultSet implements IResultSet {
	get totalPages(): number {
		var tp = Math.ceil(this.total / 10);
		return tp;
	}
	get previousPage(): number {
		return this.currentPage > 1 ? this.currentPage - 1 : null;
	}
	get nextPage(): number {
		return this.currentPage < this.totalPages ? this.currentPage + 1 : null;
	}
	constructor(public total: number, public results: any[], public currentPage: number = 1) { }
}

export interface ITemplateSet {
	searchFormTemplate: string;
	resultsTemplate: string;
	viewTemplate: string;
	infoWindowTemplate: string;
}

export class TemplateSet implements ITemplateSet {
	searchFormTemplate: string;
	resultsTemplate: string;
	viewTemplate: string;
	infoWindowTemplate: string;

	constructor(templateSet?: ITemplateSet) {
		if (templateSet) {
			Object.assign(this, templateSet);
		}
	}

	private _searchForm: IHandlebarsTemplate = null;
	public get searchForm(): IHandlebarsTemplate { return this.getTemplate('searchForm'); }

	private _results: IHandlebarsTemplate = null;
	public get results(): IHandlebarsTemplate { return this.getTemplate('results'); }

	private _view: IHandlebarsTemplate = null;
	public get view(): IHandlebarsTemplate { return this.getTemplate('view'); }

	private _infoWindow: IHandlebarsTemplate = null;
	public get infoWindow(): IHandlebarsTemplate { return this.getTemplate('infoWindow'); }

	private getTemplate(name: string): IHandlebarsTemplate {
		if (!this['_' + name]) {
			this['_' + name] = handlebars.compile(this[name + 'Template']);
		}
		return this['_' + name];
	}
}

export interface IHandlebarsTemplate {
	(object: any, handlebars?: any): string;
}

export interface IMapOptions {
	initialLocation: {
		lat: number;
		lng: number;
	};
	initialZoom: number;
	fields: {
		lat: string;
		lng: string;
		title: string;
	};
}

export class MapOptions implements IMapOptions {
	initialLocation: {
		lat: number;
		lng: number;
	} = null;
	initialZoom: number;
	fields: {
		lat: string;
		lng: string;
		title: string;
	} = null;

	constructor(mapOptions?: IMapOptions) {
		if (mapOptions) {
			Object.assign(this, mapOptions);
		}
	}
}

export interface ITerm {
	term: string;
	count: number;
	slug: string;
}

export class Term implements ITerm {
	private _slug: string = null;
	public get slug(): string {
		if (!this._slug) {
			this._slug = s(this.term).slugify().s;
		}
		return this._slug;
	}
	constructor(public term: string, public count: number) { }
}

export interface ITermCollection {
	[field: string]: Term[];
}

export interface ITermQuery {
	terms: {
		[field: string]: string[]
	}
}

export interface IRangeQuery {
	range: {
		[field: string]: {
			[operator: string]: string
		}
	}
}

export interface IGeoQuery {
	query: {
		geo_distance_range: {
			lt: string;
			field: string;
			[field: string]: {
				lat: number,
				lon: number
			} | string;
		}
	};
	sort: {
		_geo_distance: {
			order: string;
			unit: string;
			distance_type: string;
			[field: string]: {
				lat: number,
				lon: number
			} | string;
		}
	};
};

export interface IQueryQuery {
	simple_query_string: {
		query: string;
		analyzer: string;
	};
}

handlebars.registerHelper('xif', function (v1, operator, v2, options) {
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

handlebars.registerHelper('uri', function (uri) {
	if (!uri) {
		return null;
	}

	if (uri.indexOf('http') !== 0) {
		uri = 'http://' + uri;
	}

	return uri;
});

handlebars.registerHelper('any', function () {
	var options = arguments[arguments.length - 1];
	var any = false;
	for (var i = 0; i < arguments.length - 1; i++) {
		if (arguments[i]) {
			any = true;
			break;
		}
	}
	if (any) {
		return options.fn(this);
	} else {
		return options.inverse(this);
	}
})

handlebars.registerHelper('validtel', function (tel, options) {
	return !tel || tel.replace(/[^0-9]/igm, '') == '' ? options.inverse(this) : options.fn(this);
});

handlebars.registerHelper('validpa', function (pa, options) {
	if (!pa || pa.organisationLocationsHomeAddress) {
		return options.inverse(this);
	}

	var lines = [];
	if (pa.organisationLocationsStreet) lines.push(pa.organisationLocationsStreet);
	if (pa.organisationLocationsAreaTown) lines.push(pa.organisationLocationsAreaTown);
	if (pa.organisationLocationsCityCounty) lines.push(pa.organisationLocationsCityCounty);
	if (pa.organisationLocationsPostcode) lines.push(pa.organisationLocationsPostcode);

	return lines.length == 0 ? options.inverse(this) : options.fn(this);
});

handlebars.registerHelper('bootstrap', function (version, options) {
	var loaded = $('link[href*="bootstrap"][href*="' + version + '"]').length > 0;
	return loaded ? options.inverse(this) : options.fn(this);
});

handlebars.registerHelper('pa', function (pa) {
	var lines = [];
	if (pa.organisationLocationsStreet) lines.push(pa.organisationLocationsStreet);
	if (pa.organisationLocationsAreaTown) lines.push(pa.organisationLocationsAreaTown);
	if (pa.organisationLocationsCityCounty) lines.push(pa.organisationLocationsCityCounty);
	if (pa.organisationLocationsPostcode) lines.push(pa.organisationLocationsPostcode);

	if (lines.length > 0) {
		return new handlebars.SafeString(
			"<addr>" + lines.join(',<br />') + "<addr>"
		);
	} else {
		return new handlebars.SafeString('No address listed');
	}
});

handlebars.registerHelper('ps', function (str) {
	if (!str) {
		return new handlebars.SafeString('');
	}
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
		} else if (!nextBullet && currBullet) { //Ending a list
			out += '<li>' + stripBullet(curr) + '</li></ul>';
		} else if (currBullet) { //In a list
			out += '<li>' + stripBullet(curr) + '</li>';
		} else { //Regular Paragraph
			out += '<p>' + curr + '</p>';
		}
	}

	function isBullet(str) {
		return str.match(/(?:^[\s\t]*[.->•*][\s\t]*)(?:.*$)/igm) || false;
	}

	function stripBullet(str) {
		return str.replace(/(^[\s\t]*[.->•*][\s\t]*)/, '');
	}

	return new handlebars.SafeString(out);
});

handlebars.registerHelper('round', function (number, dp) {
	return number.toFixed(dp);
});

handlebars.registerHelper('picklist', function (picklist, defaultString) {
	return new handlebars.SafeString('');

});

handlebars.registerHelper('abx', function (bool, a, b, c) {
	switch (typeof bool) {
		case ('boolean'):
			return bool ? a : b;
		case ('string'):
			bool = bool.toLowerCase();
			var affirmative = ['true', 'yes', 'y', 'aye', 'correct', 'yeah', 'yeh', 'yup', 'right', 'valid', 'success', '1'];
			return affirmative.indexOf(bool) > -1 ? a : b;
		case ('number'):
			return bool === 0 ? b : a;
		default:
			return a || b;
	}
});

handlebars.registerHelper('inc', function (int) {
	return int + 1;
});