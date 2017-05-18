import * as jq from 'jquery';
import * as elasticsearch from 'elasticsearch';
import * as handlebars from 'handlebars';
import * as s from 'string';
import * as ResultsCountPartial from '../templates/results-count.hbs';

import '../styles/main.scss';

export abstract class BaseWidget {
    private scriptTag;
    protected searchElement;
    protected resultsElement;
    private terms: ITermCollection;

    private _client: elasticsearch.Client = null;
    protected get client(): elasticsearch.Client {
        if (this._client === null) {
            this._client = new elasticsearch.Client({
                host: 'https://readonly:onlyread@4c19757a0460c764d6e4712b0190cc21.eu-west-1.aws.found.io:9243',
                apiVersion: '2.4',
                //log: 'trace'
            });
        }
        return this._client;
    }

    constructor(private type: string, private index: string, private termFields: string[], private searchTemplate, private resultsTemplate){
        this.scriptTag = jq('script[src*="' + type + '.bundle.js"]');
        this.setupControls();
    }

    setupControls(){
        this.loadTerms().then(() => {
            var searchHtml = this.searchTemplate({ terms: this.terms });
			this.searchElement = jq('<div></div>').addClass('milo-widget').html(searchHtml).insertAfter(this.scriptTag);
            this.resultsElement = this.searchElement.find('.mw-results');
            this.bindControls();
        }).catch((err) => {
            console.error('Failed to get terms', err);
        });
    }

    bindControls(){
        console.warn('Not implemented');
    }

    protected loadTerms(){
        return new Promise<void>((resolve, reject) => {
            var payload = {
                index: this.index,
                type: this.index,
                size: 0,
                body: {
                    aggs: {}
                }
            };

            this.termFields.forEach((field) => {
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
                this.termFields.forEach((field) => {
                    terms[field] = aggs[field].buckets.map((term) => new Term(term.key, term.doc_count));
                });
                this.terms = terms;
                resolve();
            }).catch((err) => {
                reject(err);
            })
        });
    }

    protected runQuery(query){
        return new Promise<any>((resolve, reject) => {
            this.client.search(query, (err, results) => {
                if(err){
                    console.error(err);
                    reject(err);
                    return;
                }
                resolve(results);
            });
        })
    }

    protected search(query, page = 1){
		var from = (page - 1) * 10;
        var payload: any = {
            index: this.index,
            type: this.index,
            body: {
                query: query,
				from: from
            }
        };

		if(payload.body.query.hasOwnProperty('sort')){
			payload.body.sort = payload.body.query.sort;
			delete payload.body.query.sort;
		}

		console.log(payload);

        this.runQuery(payload).then((response) => {
			console.log(response);
			var resultSet: ResultSet = new ResultSet(
				response.hits.total,
				response.hits.hits.map((hit) => hit._source),
				page);
            var resultsHtml = this.resultsTemplate(resultSet, handlebars);
            this.resultsElement.html(resultsHtml);
            this.bindControls();
        }).catch((err) => {
            console.error('Failed to search', err);
        });
    }
}

export interface IResultSet{
    total: number;
    results: any[];
	currentPage: number;
	totalPages: number;
}

export class ResultSet implements IResultSet{
	get totalPages(): number {
		var tp = Math.ceil(this.total / 10);
		return Math.min(tp, 10);
	}
	get previousPage(): number {
		return this.currentPage > 1 ? this.currentPage - 1 : null;
	}
	get nextPage(): number {
		return this.currentPage < this.totalPages ? this.currentPage + 1 : null;
	}
	constructor(public total: number, public results: any[], public currentPage: number = 1){}
}

export interface ITerm{
	term: string;
	count: number;
	slug: string;
}

export class Term implements ITerm{
	private _slug: string = null;
	public get slug(): string {
		if(!this._slug){
			this._slug = s(this.term).slugify().s;
		}
		return this._slug;
	}
	constructor(public term: string, public count: number){	}
}

export interface ITermCollection {
	[field: string]: Term[];
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

	if(uri.indexOf('http') !== 0){
		uri = 'http://' + uri;
	}

	return uri;
});

handlebars.registerHelper('validtel', function (tel, options) {
	return !tel || tel.replace(/[^0-9]/igm, '') == '' ? options.inverse(this) : options.fn(this);
});

handlebars.registerHelper('validpa', function (pa, options) {
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

handlebars.registerHelper('bootstrap', function (version, options) {
	var loaded = $('link[href*="bootstrap"][href*="' + version + '"]').length > 0;
	return loaded ? options.inverse(this) : options.fn(this);
});

handlebars.registerHelper('pa', function (pa) {
	var lines = [];
	if (pa.locationStreet) lines.push(pa.locationStreet);
	if (pa.locationAreaTown) lines.push(pa.locationAreaTown);
	if (pa.locationCityCounty) lines.push(pa.locationCityCounty);
	if (pa.locationPostcode) lines.push(pa.locationPostcode);

	if(lines.length > 0){
		return new handlebars.SafeString(
			"<addr>" + lines.join(',<br />') + "<addr>"
		);
	}else{
		return new handlebars.SafeString('No address listed');
	}
});

handlebars.registerHelper('ps', function (str) {
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
		case('boolean'):
			return bool ? a : b;
		case('string'):
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