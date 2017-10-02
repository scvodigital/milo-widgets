import * as jq from 'jquery';
import { BaseWidget, IWidgetConfiguration, ResultSet, TemplateSet, MapOptions } from './base-widget';
import '../styles/goodhq-font.scss';

class GoodHQWidget extends BaseWidget {
    xid: string = 'undefined';
    style: string = 'basic';
    hideMap: boolean = true;

    constructor() {
        super('');
        this.xid = this.scriptTag.data('xid');
        this.style = this.scriptTag.data('style');
        this.hideMap = true;
    }

    doOldSearch(page: number = 1) {
        var must = [];

        must.push({
            "term": {
                "xid": this.xid
            }
        });

        var payload: any = {
            "bool": {
                "must": must,
                "minimum_should_match": 1
            },
            "size": 1
        };

        this.search(payload, page).then((resultSet: ResultSet) => {});
    }
}

var widget = new BaseWidget('goodhq');
