import * as jq from 'jquery';
import { BaseWidget, IWidgetConfiguration, ResultSet, TemplateSet, MapOptions } from './base-widget';
import * as GoogleMapsLoader from 'google-maps'

const organisationsConfiguration: IWidgetConfiguration = {
    index: 'web-content',
    type: 'goodhq-organisation',
    termFields: ['xid'],
    templateSet: new TemplateSet({
        searchFormTemplate: '',
        resultsTemplate: '',
        viewTemplate: '',
        infoWindowTemplate: ''
    }),
    mapOptions: {
        fields: {
            lat: 'coords.lat',
            lng: 'coords.lon',
            title: 'title'
        },
        initialLocation: { lat: 56.85132, lng: -4.1180987 },
        initialZoom: 6
    },
    name: 'goodhq',
    title: 'Good HQ organisations',
    sort: {
        title: 'asc'
    },
    autoSearch: true
}

class GoodHQWidget extends BaseWidget {
    xid: string;
    style: string = 'basic';
    hideMap: boolean = true;

    constructor() {
        super('');
        this.xid = this.scriptTag.data('xid');
        if (!this.xid) this.xid = 'undefined';
        this.style = this.scriptTag.data('style');
        if (!this.style) this.xid = 'basic';
        this.hideMap = true;
    }

    doOldSearch(page: number = 1) {
        var must = [];

        must.push({ term: { xid: this.xid } });
        // must.push({
        //     simple_query_string: {
        //         query: {
        //             query_string: {
        //                 fields: ['xid'],
        //                 query: this.xid
        //             }
        //         },
        //         default_operator: 'AND',
        //         minimum_should_match: '100%'
        //     }
        // });

        var payload: any = {
            bool: {
                must: must,
                minimum_should_match: 1
            },
            size: 1
        };

        this.search(payload, page).then((resultSet: ResultSet) => {});
    }
}

var widget = new BaseWidget('goodhq');
