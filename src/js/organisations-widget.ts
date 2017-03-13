import * as jq from 'jquery';
import { BaseWidget } from './base-widget';
import * as SearchTemplate from '../templates/organisations-search.hbs';
import * as ResultsTemplate from '../templates/organisations-results.hbs';

class OrganisationWidget extends BaseWidget {
    constructor() {
        super('organisations', 'milo-organisation', ['mainActivitiesGlobal'], SearchTemplate, ResultsTemplate);
    }

    bindControls(){
        jq('#mw-organisations-search').off('click').on('click', () => {
            this.doSearch();
        });
        jq('#mw-organisations-search').off('click').on('click', () => {
            this.doSearch();
        });
    }

    doSearch(){
        var query = jq('#mw-organisations-query').val();
        var activity = jq('#mw-organisations-activity').val();

        var must = [];

        if(activity !== ''){
            must.push({
                terms: {
                    mainActivitiesGlobal_slugs: [activity]
                }
            });
        }

        if(query !== ''){
            must.push({
                simple_query_string: {
                    query: query,
                    analyzer: "snowball"
                }
            });
        }

        var payload = {
            bool: {
                must: must,
                minimum_should_match: 1
            }
        };

        this.search(payload);
    }
}

var widget = new OrganisationWidget();