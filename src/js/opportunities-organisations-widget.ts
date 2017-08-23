import * as jq from 'jquery';
import { BaseWidget, IWidgetConfiguration, ResultSet, TemplateSet, MapOptions } from './base-widget';

const organisationConfiguration: IWidgetConfiguration = {
    index: 'milo-organisation',
    type: 'milo-organisation',
    termFields: ['mainActivitiesGlobal'],
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
            title: 'name'
        },
        initialLocation: { lat: 56.85132, lng: -4.1180987 },
        initialZoom: 6
    },
    name: 'organisations',
    title: 'Milo organisations search for volunteering opportunities',
    sort: {
        name: 'asc'
    },
    autoSearch: false
}

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
                simple_query_string: {
                    query: query,
                    default_operator: 'AND',
                    minimum_should_match: '100%'
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

var widget = new BaseWidget('opportunities-organisations');
