import * as jq from 'jquery';
import { BaseWidget, IWidgetConfiguration, ResultSet, TemplateSet, MapOptions } from './base-widget';
import * as GoogleMapsLoader from 'google-maps'

const organisationsConfiguration: IWidgetConfiguration = {
    index: 'goodhq-organisation',
    type: 'organisation',
    termFields: ['xid'],
    templateSet: new TemplateSet({
        searchFormTemplate: '',
        resultsTemplate: '',
        viewTemplate: '',
        infoWindowTemplate: ''
    }),
    mapOptions: {
        fields: {
            lat: 'geo_coords.lat',
            lng: 'geo_coords.lon',
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

    constructor() {
        super('');
        this.xid = this.scriptTag.data('xid');
        this.style = this.scriptTag.data('style');
    }

    doOldSearch(page: number = 1) {
        var must = [];

        if (this.xid) {
            must.push({ term: { xid: this.xid } });
        } else {
            return;
        }

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
