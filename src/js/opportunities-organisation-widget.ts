import * as jq from 'jquery';
import { BaseWidget, IWidgetConfiguration, ResultSet, TemplateSet, MapOptions } from './base-widget';
import * as GoogleMapsLoader from 'google-maps'

const opportunitiesConfiguration: IWidgetConfiguration = {
    index: 'web-content',
    type: 'milo-volunteering-opportunity',
    termFields: ['work_type', 'client_group'],
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
    name: 'opportunities',
    title: 'Milo volunteering opportunities',
    sort: {
        title: 'asc'
    },
    autoSearch: true
}

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
            must.push({ term: { organisation_charity_number: this.org } });
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
