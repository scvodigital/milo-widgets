import * as jq from 'jquery';
import * as elasticsearch from 'elasticsearch';
import * as handlebars from 'handlebars';

export abstract class BaseWidget {
    private scriptTag;
    private outputElement;

    private _client: elasticsearch.Client = null;
    protected get client(): elasticsearch.Client {
        if (this._client === null) {
            this._client = new elasticsearch.Client({
                host: 'https://readonly:onlyread@4c19757a0460c764d6e4712b0190cc21.eu-west-1.aws.found.io:9243',
                apiVersion: '2.4'
            });
        }
        return this._client;
    }

    constructor(private type: string, searchTemplate: any){
        this.scriptTag = jq('script[src*="' + type + '.bundle.js"]');
        this.outputElement = jq('<div></div>').addClass('scvo-widget').text(type).insertAfter(this.scriptTag);
        var search = searchTemplate({});
        this.outputElement.html(search);
    }

    protected search(query){
        return new Promise<any>((resolve, reject) => {
            this.client.search(query, (err, results) => {
                if(err){
                    console.error(err);
                    reject(err);
                    return;
                }
                console.log(results);
                resolve(results);
            });
        })
    }
}