import * as jq from 'jquery';
import { BaseWidget, IWidgetConfiguration, ResultSet, TemplateSet, MapOptions } from './base-widget';

class OpportunitiesOrganisationsWidget extends BaseWidget {
    hideMap: boolean = true;

    constructor() {
        super('');
    }

    doSearchOld(page: number = 1) {
        var query = jq('#mw-organisations-query').val();

        var must = [];

        if (query !== '') {
            must.push({
                "simple_query_string": {
                    "query": query,
                    "default_operator": "AND",
                    "minimum_should_match": "100%"
                }
            });
        }

        var payload: any = {
            "bool": {
                "must": must,
                "minimum_should_match": 1
            }
        };

        this.search(payload, page).then((resultSet: ResultSet) => {});
    }
}

var widget = new BaseWidget('opportunities-organisations');
