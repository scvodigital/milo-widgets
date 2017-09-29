import * as jq from 'jquery';
import { BaseWidget, ResultSet, TemplateSet, MapOptions } from './base-widget';

class GoodHQWidget extends BaseWidget {
    number: number = 3;
    style: string = 'basic';
    hideMap: boolean = true;

    constructor() {
        super('');
        this.number = this.scriptTag.data('number');
        this.style = this.scriptTag.data('style');
        this.hideMap = true;

        console.log("return number: "+this.number);
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
