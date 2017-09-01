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
    title: 'Milo volunteering opportunity search',
    sort: {
        title: 'asc'
    },
    autoSearch: false
}

class OpportunitiesWidget extends BaseWidget {
    tsi: number;
    org: string;
    hideMap: boolean = false;

    constructor() {
        super('');
        this.tsi = this.scriptTag.data('tsi');
        this.org = this.scriptTag.data('org');
        this.hideMap = this.scriptTag.data('hide-map') || false;
    }

    doOldSearch(page: number = 1) {
        var query = jq('#mw-opportunities-query').val();
        var distance = jq('#mw-opportunities-distance').val();
        var postcode = ""+jq('#mw-opportunities-user-postcode').val();
        var activity = jq('#mw-opportunities-activity').val();
        var client_group = jq('#mw-opportunities-client-group').val();
        var times_checkboxes = jq('[data-bind="Times"]:checked');
        var opening_times = times_checkboxes.toArray().map((time: any) => { return time.defaultValue });

        var must = [];

        if (activity !== '') {
            must.push({ term: { work_type: activity } });
        }

        if (client_group !== '') {
            must.push({ term: { client_group: client_group } });
        }

        if (this.tsi) {
            must.push({ term: { tsi_legacy_ref: this.tsi } });
        }

        if (this.org) {
            must.push({ term: { organisation_charity_number: this.org } });
        }

        if (opening_times && opening_times.length > 0) {
            var times_or: { term: { [field: string]: boolean } }[] = [];
            times_or = opening_times.map((time) => {
                return { term: { [time]: true } }
            });
            must.push({
                bool: {
                    should: times_or,
                    minimum_should_match: 1
                }
            })
        }

        if (query !== '') {
            must.push({
                simple_query_string: {
                    query: query,
                    default_operator: 'AND'
                }
            });
        }

        var payload: any = {
            bool: {
                must: must
            }
        };

        if (distance && distance > 0 && postcode) {
            postcode = postcode.toLowerCase().replace(/[^0-9a-z]/gi, '');
            jq.getJSON(window.location.protocol + '//api.postcodes.io/postcodes/' + postcode, (result) => {
                if (result.status === 200) {
                    var geo = {
                        geo_distance_range: {
                            lt: distance + 'mi',
                            field: 'coords',
                            coords: {
                                lat: result.result.latitude,
                                lon: result.result.longitude
                            }
                        }
                    }

                    payload.bool.must.push(geo);

                    var sort = [
                        {
                            _geo_distance: {
                                coords: {
                                    lat: result.result.latitude,
                                    lon: result.result.longitude
                                },
                                order: 'asc',
                                unit: 'mi',
                                distance_type: 'arc'
                            }
                        }
                    ];
                    payload.sort = sort;
                }
                this.search(payload, page).then((resultSet: ResultSet) => {});
            });
        } else {
            this.search(payload, page).then((resultSet: ResultSet) => {});
        }
    }
}

var widget = new BaseWidget('opportunities');
