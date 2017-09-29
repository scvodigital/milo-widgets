import * as jq from 'jquery';
import { BaseWidget, IWidgetConfiguration, ResultSet, TemplateSet, MapOptions } from './base-widget';
// import * as GoogleMapsLoader from 'google-maps'

class GoodHQWidget extends BaseWidget {
    xid: string;
    style: string = 'basic';
    number: number = 3;
    hideMap: boolean = true;

    constructor() {
        super('');
        this.style = this.scriptTag.data('style');
        this.number = this.scriptTag.data('number');
        this.hideMap = true;
    }

    doOldSearch(page: number = 1) {
        var must = [];

        must.push({});

        var payload: any = {
            "bool": {
                "must": must,
                "minimum_should_match": 1
            },
            "size": this.number
        };

        this.search(payload, page).then((resultSet: ResultSet) => {});
    }
}

var widget = new BaseWidget('goodmoves');
