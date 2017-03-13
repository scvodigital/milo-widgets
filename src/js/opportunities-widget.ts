import * as jq from 'jquery';
import { BaseWidget } from './base-widget';
import * as SearchTemplate from '../templates/opportunities-search.hbs';
import * as ResultsTemplate from '../templates/organisations-results.hbs';

class OpportunitiesWidget extends BaseWidget {
    constructor() {
        super('opportunities', 'volunteering-opportunity', ['workType', 'clientGroup'], SearchTemplate, ResultsTemplate);
    }

    bindControls(){
        jq('#mw-opportunities-show-hide-opening-times').off('click').on('click', () => {
            jq('.mw-opportunities-times').toggleClass('hide');
        });
    }
}

var widget = new OpportunitiesWidget();