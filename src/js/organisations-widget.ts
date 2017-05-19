import * as jq from 'jquery';
import { BaseWidget } from './base-widget';
import * as SearchTemplate from '../templates/organisations-search.hbs';
import * as ResultsTemplate from '../templates/organisations-results.hbs';

class OrganisationWidget extends BaseWidget {
    tsi: number;

    constructor() {
        super('organisations', 'milo-organisation', ['mainActivitiesGlobal'], SearchTemplate, ResultsTemplate);
        this.tsi = this.scriptTag.data('tsi');
    }

    bindControls(){
        jq('#mw-organisations-search').off('click').on('click', () => {
            this.doSearch();
        });
        jq('#mw-organisations-expand-collapse-all').off('click').on('click', () => {
            var total = jq('.mw-organisations-result .panel-collapse').length;
            var closed = jq('.mw-organisations-result .panel-collapse.hide').length;

            var half = Math.floor(total / 2);

            if(closed < half){
                jq('.mw-organisations-result .panel-collapse').addClass('hide');
            }else{
                jq('.mw-organisations-result .panel-collapse').removeClass('hide');
            }
        });
        jq('.mw-organisations-result .panel-heading').off('click').on('click', function(event) {
            var $this = jq(this);
            var body = $this.next('.panel-collapse');
            body.toggleClass('hide');
        });
        jq('#mw-organisations-query').off('keypress').on('keypress', (event) => {
            if(event.which === 13){
                this.doSearch();
            }
        });
        this.searchElement.find('.pager button').off('click').on('click', (event: JQueryEventObject) => {
            var page = jq(event.currentTarget).data('search');
            console.log(page);
            this.doSearch(page);
        });
    }

    doSearch(page: number = 1){
        var query = jq('#mw-organisations-query').val();
        var activity = jq('#mw-organisations-activity').val();

        var must = [];

        if(activity !== ''){
            must.push({ term: { mainActivitiesGlobal_slugs: activity } });
        }

        if(this.tsi){
            must.push({ term: { tsiLegacyRef: this.tsi } });
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

        this.search(payload, page);
    }
}

var widget = new OrganisationWidget();