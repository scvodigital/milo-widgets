import * as jq from 'jquery';
import { BaseWidget, ResultSet, TemplateSet, MapOptions } from './base-widget';
import * as GoogleMapsLoader from 'google-maps'

class OpportunitiesOrganisationWidget extends BaseWidget {
    org: string;
    hideMap: boolean = true;

    constructor() {
        super('');
        this.org = this.scriptTag.data('org');
    }

    doOldSearch(page: number = 1) {
        var must = [];

        if (this.org) {
            must.push({
                term: {
                    organisation_charity_number: this.org
                }
            });
        }

        var payload: any = {
            bool: {
                must: must,
                minimum_should_match: 1
            }
        };

        this.search(payload, page).then((resultSet: ResultSet) => {});
    }
}

var widget = new BaseWidget('opportunities-organisation');
