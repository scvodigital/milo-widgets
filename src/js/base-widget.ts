import * as elasticsearch from 'elasticsearch';
import * as handlebars from 'handlebars';
import * as helpers from 'handlebars-helpers';
import * as s from 'string';
import * as jq from 'jquery';
import * as GoogleMapsLoader from 'google-maps';
import 'core-js';

import * as BaseTemplate from '../templates/base.hbs';
import * as NavigationTemplate from '../templates/navigation.hbs';

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
    protected hideMap: boolean = true;
    protected hideTitle: boolean = false;
	protected map: google.maps.Map;
	protected markers: google.maps.Marker[] = [];
	protected infoWindows: google.maps.InfoWindow[] = [];
	protected doc: any;

    private perPage: number = 10;

	private _client: elasticsearch.Client = null;
	protected get client(): elasticsearch.Client {
		if (this._client === null) {
			this._client = new elasticsearch.Client({
				host: 'https://readonly:onlyread@50896fdf5c15388f8976945e5582a856.eu-west-1.aws.found.io:443',
				apiVersion: '5.x',
			});
		}
		return this._client;
	}

	constructor(name: string) {
		this.scriptTag = jq('script[src*="' + name + '.bundle.js"]');

		if (this.scriptTag.data('widget')) {
			name = this.scriptTag.data('widget');
		}

		this.widgetElement = jq('<div><strong>Loading&hellip;</strong></div>').addClass('mw-search-widget').attr('id', 'mw-' + name + '-widget').insertAfter(this.scriptTag);
		jq.getJSON('https://scvo-widgets-9d094.firebaseio.com/configurations/' + name + '.json').then((configuration) => {
			this.config = new WidgetConfiguration(configuration);

            this.config.style = this.scriptTag.data('widget-style') || 'basic';
            // if (this.config.style == 'enhanced') {
            //     this.perPage = 5;
            // }

            this.hideTitle = this.scriptTag.data('hide-title') || false;
            this.hideMap = this.scriptTag.data('hide-map') || false;

			(<any>GoogleMapsLoader)['KEY'] = 'AIzaSyBGANoz_QO2iBbM-j1LIvkdaH6ZKnqgTfA';
			(<any>GoogleMapsLoader)['LIBRARIES'] = ['geometry', 'places'];

			this.setupControls();

			window.addEventListener('hashchange', () => { this.hashChange(true); }, false);
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
			var searchHtml = this.config.templateSet.searchForm({
                "terms": this.terms
            });

			this.widgetElement.html(baseHtml);
			this.searchElement = this.widgetElement.find('.mw-search-form');
			this.bodyElement = this.widgetElement.find('.mw-body');
			this.mapElement = this.widgetElement.find('.mw-map');

            if (this.hideTitle) {
                this.widgetElement.find('.mw-title').addClass('hidden');
            }
            if (this.hideMap) {
                this.mapElement.hide();
            }

			this.searchElement.html(searchHtml);

			this.setupMap().then(() => {
				this.bindControlsOnce();
				this.updateBody('');
				this.hashChange();

				if (this.config.autoSearch) {
					this.doSearch(1);
				}
			});
		}).catch((err) => {
			console.error('Failed to get terms', err);
		});
	}

	bindControlsOnce() {
		this.widgetElement.find('.mw-search-button').off('click').on('click', () => {
			this.doSearch(1);
			window.location.hash = 'mw-' + this.config.name + '-top';
		});

		this.widgetElement.find('[data-show-hide-toggle]').each((i, o) => {
			o = jq(o);
			o.on('click', () => {
				this.showHide(o);
			});
			this.showHide(o);
		});
	}

	showHide(element, hide?: boolean) {
		var targetSelector = element.data('show-hide-toggle');
		var target = jq(targetSelector);
		var text = element.find('.mw-show-hide-text');
		var icon = element.find('.mw-show-hide-icon');
		if (!target.hasClass('hide') || (typeof hide === 'boolean' && hide)) {
			target.addClass('hide');
			text.text('Show');
			icon.removeClass('fa-eye-slash').addClass('fa-eye');
		} else {
			target.removeClass('hide');
			text.text('Hide');
			icon.removeClass('fa-eye').addClass('fa-eye-slash');
		}
	}

	bindControls() {
		this.widgetElement.find('.mw-back-to-results').off('click').on('click', () => {
			this.renderResults(true);
			window.location.hash = 'mw-' + this.config.name + '-top';
		});

		this.widgetElement.find('.mw-print').off('click').on('click', () => {
			this.print();
		});

		this.widgetElement.find('.mw-previous, .mw-next').off('click').on('click', (e) => {
			var page = jq(e.currentTarget).data('page');
			this.doSearch(page);
		});

		this.searchElement.find('input').off('keyup').on('keyup', (e) => {
			if (e.which === 13) {
				this.doSearch(1);
			}
		});
	}

	protected loadTerms() {
		return new Promise<void>((resolve, reject) => {
            if (this.config.termFields && this.config.termFields.length > 0) {
                var payload = {
    				"index": this.config.index,
    				"type": this.config.type,
    				"body": {
    					"_source": false,
                        "size": 0,
    					"aggs": {},
                        "query": {
                            "bool": {
                                "must": []
                            }
                        }
    				}
    			};

                var injected: ITermQuery[] = this.getInjected();
				payload.body.query.bool.must = payload.body.query.bool.must.concat(injected);

    			this.config.termFields.forEach((field) => {
    				payload.body.aggs[field] = {
    					"terms": {
    						"field": field,
    						"order": {
                                "_term" : "asc"
                            },
                            "size": 10000
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
    			});
            } else {
                resolve();
            }
		});
	}

	doSearch(page: number = 1, jump: boolean = false) {
		this.getPostcodeQuery().then((geo: IGeoQuery) => {
			this.getLocationQuery().then((location: IGeoBoundingBoxQuery) => {
                var allowSort = true;

				var terms: ITermQuery[] = this.getTerms();
				var injected: ITermQuery[] = this.getInjected();
				var ranges: IRangeQuery[] = this.getRanges();
				var query: IQueryQuery = this.getQuery();

				var payload: any = {
					"bool": {
						"must": []
					}
				}

				payload.bool.must = payload.bool.must.concat(terms);
				payload.bool.must = payload.bool.must.concat(injected);
				payload.bool.must = payload.bool.must.concat(ranges);

                if (payload.bool.must.length > 1) {
                    allowSort = false;
                }

				if (geo) {
					payload.sort = geo.sort;
                    allowSort = false;
				}

				if (location) {
					payload.bool.must.push(location);
                    allowSort = false;
				}

				if (query) {
					payload.bool.must.push(query);
                    allowSort = false;
				}

				this.search(payload, page, jump, allowSort).then((resultSet: ResultSet) => {});
			});
		});
	}

    private getInjected(): ITermQuery[] {
		if (!this.config.injectableFilters) {
			return [];
		}

		var must: ITermQuery[] = [];
		this.config.injectableFilters.forEach((filter: IInjectableFilter) => {
			var value: string = this.scriptTag.data(filter.attribute);
			if (typeof value !== 'undefined' && value !== null) {
				var query: ITermQuery = {
					"terms": {
						[filter.field]: [value]
					}
				};
				must.push(query);
			}
		});

		return must;
	}

	private getQuery(): IQueryQuery {
		var queryString = this.widgetElement.find('[data-query]').val() || null;
		if (!queryString) {
			return null;
		} else {
			var query: IQueryQuery = {
				"simple_query_string": {
					"query": queryString,
                    "default_operator": 'AND'
				}
			};
			return query;
		}
	}

	private getLocationQuery(): Promise<IGeoBoundingBoxQuery> {
		return new Promise<IGeoBoundingBoxQuery>((resolve, reject) => {
			var locationElement = this.widgetElement.find('[data-geo-code]');
			var field = locationElement.data('geo-code');
			var query = locationElement.val();
			if (!query) {
				return resolve(null);
			}

			this.getLocation(query).then((bounds: IBounds) => {
				if (!bounds) {
					console.error('Failed to lookup location', query);
					return resolve(null);
				}

				var geo: IGeoBoundingBoxQuery = {
					"geo_bounding_box": {
						[field]: {
							"top_right": bounds.northeast,
							"bottom_left": bounds.southwest
						}
					}
				};
				resolve(geo);
			}).catch((err) => {
				console.error('Failed to get location', err);
			});
		});
	}

	private getPostcodeQuery(): Promise<IGeoQuery> {
		return new Promise<IGeoQuery>((resolve, reject) => {
			var postcodeElement = this.widgetElement.find('[data-geo]');
			var postcode = postcodeElement.val() || null;
			var unit = 'mi';
            if (!postcode) {
				return resolve(null);
			}

			this.getPostcode(postcode).then((location: ILocation) => {
				if (!location) {
					console.error('Failed to get postcode', postcode);
					return resolve(null);
				}

				var field = postcodeElement.data('geo');
				var geo = {
					"query": {},
					"sort": {
						"_geo_distance": {
							[field]: {
								"lat": location.lat,
								"lon": location.lon
							},
							"order": 'asc',
							"unit": unit,
							"distance_type": 'arc'
						}
					}
				};

				resolve(geo);
			}).catch((err) => {
				console.error('Failed to get postcode', err);
				resolve(null);
			});
		});
	}

	private getPostcode(postcode: string): Promise<ILocation> {
		return new Promise<ILocation>((resolve, reject) => {
			jq.getJSON(window.location.protocol + '//api.postcodes.io/postcodes/' + postcode, (result) => {
				if (result.status === 200) {
					if (result.result && result.result.latitude && result.result.longitude) {
						resolve({
							"lat": result.result.latitude,
							"lon": result.result.longitude
						});
					} else {
						resolve(null);
					}
				} else {
					resolve(null);
				}
			});
		});
	}

	private getLocation(query: string): Promise<IBounds> {
		return new Promise<IBounds>((resolve, reject) => {
			jq.getJSON('https://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURIComponent(query) + ', Scotland, UK', (result) => {
				if (result && result.status && result.status === "OK" && result.results && result.results.length > 0) {
					var location = result.results[0];
					if (location.geometry && location.geometry.bounds) {
						resolve({
							"northeast": {
								"lat": location.geometry.bounds.northeast.lat,
								"lon": location.geometry.bounds.northeast.lon,
							},
							"southwest": {
								"lat": location.geometry.bounds.southwest.lat,
								"lon": location.geometry.bounds.southwest.lon,
							}
						});
					} else {
						resolve(null);
					}
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
			o = jq(o);
			var term = o.data('term');
			if (o.attr('type') === 'checkbox' || o.attr('type') === 'radio') {
				if (o.attr('type') === 'checkbox') {
					if (o.is(':checked')) {
						terms[term] = ['true'];
					}
				} else if (jq(o).attr('type') === 'radio') {
					if (o.is(':selected')) {
						terms[term] = ['true'];
					}
				}
			} else if (o.val() && o.val() !== '') {
				if (!terms.hasOwnProperty(term)) {
					terms[term] = [];
				}
				var value = ""+jq(o).val();
				if (Array.isArray(value)) {
					terms[term] = terms[term].concat(value);
				} else {
					terms[term].push(value);
				}
			}
		});

		Object.keys(terms).forEach((key) => {
			var term = {
				"terms": {
                    [key]: terms[key]
                }
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
			ranges[field][operator] = ""+jq(o).val();
		});

		Object.keys(ranges).forEach((field) => {
			var range = {
				"range": {
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
				"id": id,
				"index": this.config.index,
				"type": this.config.type
			};

            if (this.config.type == 'milo-volunteering-opportunities' || this.config.type == 'milo-organisations') {
                this.logAnalytics(payload, 'document');
            }

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
			this.widgetElement.find('.mw-back-to-results').show();
			if (this.doc) {
				this.widgetElement.find('.mw-paging').hide();
				this.widgetElement.find('.mw-document-nav').show();
			} else {
				this.widgetElement.find('.mw-paging').show();
				this.widgetElement.find('.mw-document-nav').hide();

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
			if (this.doc) {
				this.widgetElement.find('.mw-document-nav').show();
				this.widgetElement.find('.mw-navigation').show();
			} else {
				this.widgetElement.find('.mw-document-nav').hide();
				this.widgetElement.find('.mw-navigation').hide();
			}
		}

		this.bindControls();
		this.placeMarkers();

		if (jump) {
			var topElement = this.widgetElement.find('[name="mw-' + this.config.name + '-top"]');
			var top = topElement.offset().top;
			window.scroll(0, top);
            jump = false;
		}
	}

	print() {
		if (!this.doc) {
			return;
		}
		var content = this.config.templateSet.view(this.doc, handlebars);
		var template = '<html></head><title>'+this.config.title+'</title><link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" /></head><body>'+content+'<script>window.print();var me = window.parent.document.getElementById(\'print-frame-'+this.config.name+'\');me.parentNode.removeChild(window.parent.document.getElementById(\'print-frame-'+this.config.name+'\'));</script></body></html>';
		var frame = jq('<iframe />', {
			src: 'about:blank',
			border: 0,
			id: 'print-frame-' + this.config.name
		}).css({
			width: 800,
			height: 800,
			visibility: 'hidden'
		}).appendTo('body');

		var iframe = (<any>frame.get(0)).contentWindow;
		iframe.document.write(template);
		iframe.focus();
	}

	protected search(query, page = 1, jump: boolean = false, allowSort: boolean = true) {
		return new Promise((resolve, reject) => {
			var from = (page - 1) * this.perPage;

			var payload: any = {
				"index": this.config.index,
				"type": this.config.type,
				"body": {
					"query": query,
                    "size": this.perPage,
					"from": from
				}
			};

            if (this.config.type == 'goodhq-organisation') {
                payload.body._source = ['Id', 'rendered.widget_basic'];
            } else if (this.config.type == 'milo-volunteering-opportunity') {
                payload.body._source = ['rendered.search_result', 'rendered.search_result_map', 'coords'];
            } else if (this.config.type == 'milo-organisation') {
                if (this.config.style == 'enhanced') {
                    payload.body._source = ['rendered.search_result_enhanced', 'rendered.search_result_map', 'coords'];
                } else {
                    payload.body._source = ['rendered.search_result', 'rendered.search_result_map', 'coords'];
                }
            } else {
                payload.body._source = ['rendered.search_result_widget'];
            }

			if (payload.body.query.hasOwnProperty('sort')) {
				payload.body.sort = payload.body.query.sort;
				delete payload.body.query.sort;
			} else if(allowSort) {
				payload.body.sort = this.config.sort;
			}

            if (this.config.type == 'milo-volunteering-opportunity' || this.config.type == 'milo-organisation') {
                this.logAnalytics(payload, 'search');
            }

			this.runQuery(payload).then((response) => {
				var resultSet: ResultSet = new ResultSet(
					response.hits.total,
					response.hits.hits.map((hit) => hit._source),
					page
                );
				this.resultSet = resultSet;
				this.renderResults(jump);
				resolve(resultSet);
			}).catch((err) => {
				console.error('Failed to search', err);
				reject(err);
			});
		});
	}

	logAnalytics(body, func) {
		body = {
			"name": this.config.name,
			"payload": body,
			"function": func
		}
		jq.ajax({
			"url": 'https://us-central1-scvo-widgets-9d094.cloudfunctions.net/analytics',
			"type": 'POST',
			"data": JSON.stringify(body, null, 4),
			"contentType": 'application/json',
			complete: (analytics) => { }
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

			var bounds = new google.maps.LatLngBounds();
			var items = this.doc ? [this.doc] : this.resultSet ? this.resultSet.results : [];

			items.forEach((result) => {
				var lat = this.propertyByString(result, this.config.mapOptions.fields.lat) || false;
				var lon = this.propertyByString(result, this.config.mapOptions.fields.lng) || false;
				if (lat && lon) {
					var coords = {
                        "lat": lat,
                        "lng": lon
                    };
					var infoWindow = new google.maps.InfoWindow({
						"content": this.config.templateSet.infoWindow(result, handlebars)
					});
					var marker = new google.maps.Marker({
						"position": coords,
						"map": this.map,
						"title": result.name
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
                
                var $map = $("#mw-organisations-map");
                var startPosition = $map[0].offsetTop;
                $(window).scroll(function(){
                    var newPosition = $(window).scrollTop() - startPosition + 15;
                    if (newPosition > 0) {
                        $map.stop().animate({"marginTop": newPosition + "px"}, "slow");
                    } else {
                        $map.stop().animate({"marginTop": "0px"}, "slow");
                    }
                });

				google.maps.event.trigger(this.map, 'resize');
				window.setTimeout(() => {
					this.map.fitBounds(bounds);
					if(this.doc){
						this.map.setZoom(15);
					}
				}, 500);
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
							draggable: !("ontouchend" in document),
							scrollwheel: false
						});
						resolve();
					});
				} else {
                    resolve();
                }
			} else {
				this.mapElement.hide();
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

export interface IInjectableFilter {
	attribute: string;
	field: string;
}

export interface IWidgetConfiguration {
	index: string;
    type: string;
    style: string;
	termFields: string[];
	templateSet: TemplateSet;
	mapOptions: MapOptions;
	name: string;
	title: string;
	sort: any;
	injectableFilters?: IInjectableFilter[];
	autoSearch: boolean;
}

export class WidgetConfiguration implements IWidgetConfiguration {
	index: string = null;
    type: string = null;
    style: string = null;
	termFields: string[] = null;
	templateSet: TemplateSet = null;
	mapOptions: MapOptions = null;
	name: string = null;
	title: string = null;
	sort: any;
	injectableFilters = [];
	autoSearch: boolean = false;

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

export interface ITermFilter {
	term: {
		[field: string]: string
	}
}

export interface IRangeQuery {
	range: {
		[field: string]: {
			[operator: string]: string
		}
	}
}

export interface ILocation {
	lat: number;
	lon: number;
}

export interface IBounds {
	northeast: ILocation;
	southwest: ILocation;
}

export interface IGeoQuery {
	sort: {
		_geo_distance: {
			order: string;
			unit: string;
			distance_type: string;
			[field: string]: ILocation | string;
		}
	};
};

export interface IGeoBoundingBoxQuery {
	geo_bounding_box: {
		[field: string]: {
			top_left: ILocation;
			bottom_right: ILocation;
		} | {
			top_right: ILocation;
			bottom_left: ILocation;
		} | string;
	}
};

export interface IQueryQuery {
	simple_query_string: {
		query: string;
		analyzer?: string;
        default_operator?: string;
        minimum_should_match?: string | number;
	};
}

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

handlebars.registerHelper('times', function(n, block) {
	    var accum = '';
	    for(var i = 0; i < n; ++i) {
	        block.data.index = i;
	        block.data.first = i === 0;
	        block.data.last = i === (n - 1);
	        accum += block.fn(this);
	    }
	    return accum;
	})

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
