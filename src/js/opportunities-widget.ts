import * as jq from 'jquery';
import { BaseWidget } from './base-widget';
import * as SearchTemplate from '../templates/opportunities-search.hbs';
import * as ResultsTemplate from '../templates/organisations-results.hbs';

class OpportunitiesWidget extends BaseWidget {
    constructor() {
        super('opportunities', 'volunteering-opportunity', ['workType', 'clientGroup'], SearchTemplate, ResultsTemplate);
    }

    bindControls() {
        jq('#mw-opportunities-show-hide-opening-times').off('click').on('click', () => {
            jq('.mw-opportunities-times').toggleClass('hide');
        });

        jq('#mw-opportunities-search').off('click').on('click', () => {
            this.doSearch();
        });
    }

    doSearch(page: number = 1) {
        var query = jq('#mw-opportunities-query').val();
        var distance = jq('#mw-opportunities-distance').val();
        var postcode = jq('#mw-opportunities-user-postcode').val();
        var activity = jq('#mw-opportunities-activity').val();
        var clientGroup = jq('#mw-opportunities-client-group').val();

        var must = [];

        if (activity !== '') {
            must.push({
                terms: {
                    workType: [activity]
                }
            });
        }

        if (clientGroup !== '') {
            must.push({
                terms: {
                    clientGroup: [clientGroup]
                }
            });
        }

        if (query !== '') {
            must.push({
                simple_query_string: {
                    query: query,
                    analyzer: "snowball"
                }
            });
        }

        var payload: any = {
            bool: {
                must: must,
                minimum_should_match: 1
            }
        };

        if (distance && postcode) {
            postcode = postcode.toLowerCase().replace(/[^0-9a-z]/gi, '');
            jq.getJSON('http://api.postcodes.io/postcodes/' + postcode, (result) => {
                if (result.status === 200) {
                    var geo = {
                        geo_distance_range: {
                            lt: distance + 'mi',
                            field: 'geo_coords',
                            geo_coords: {
                                lat: result.result.latitude,
                                lon: result.result.longitude
                            }
                        }
                    }

                    payload.bool.must.push(geo);

                    var sort = [
                        {
                            _geo_distance: {
                                geo_coords: {
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
                this.search(payload, page);
            });
        } else {
            this.search(payload, page);
        }

    }
}

var widget = new OpportunitiesWidget();