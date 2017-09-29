import * as jq from 'jquery';
import { BaseWidget, ResultSet, TemplateSet, MapOptions } from './base-widget';

class OrganisationWidget extends BaseWidget {
    tsi: number;
    strive: boolean = false;
    hideMap: boolean = false;

    constructor() {
        super('');
        this.tsi = this.scriptTag.data('tsi');
        this.strive = this.scriptTag.data('strive');
        this.hideMap = this.scriptTag.data('hide-map') || false;
    }

    doSearchOld(page: number = 1) {
        var query = jq('#mw-organisations-query').val();
        var activity = jq('#mw-organisations-activity').val();
        var postcode = ""+jq('#mw-organisations-user-postcode').val();

        var must = [];

        if (activity !== '') {
            must.push({
                "term": {
                    "main_activities_global_slugs": activity
                }
            });
        }

        if (this.tsi) {
            must.push({
                "term": {
                    "tsi_legacy_ref": this.tsi
                }
            });
        }

        if (this.strive) {
            must.push({
                "term": {
                    "publish_to_strive_directory": true
                }
            });
        }

        if (query !== '') {
            must.push({
                "simple_query_string": {
                    "query": query,
                    "default_operator": 'AND',
                    "minimum_should_match": '100%'
                }
            });
        }

        var payload: any = {
            "bool": {
                "must": must,
                "minimum_should_match": 1
            }
        };

        if (postcode) {
            postcode = postcode.toLowerCase().replace(/[^0-9a-z]/gi, '');
            jq.getJSON(window.location.protocol + '//api.postcodes.io/postcodes/' + postcode, (result) => {
                if (result.status === 200) {
                    var geo = {
                        "geo_distance_range": {
                            "field": 'coords',
                            "coords": {
                                "lat": result.result.latitude,
                                "lon": result.result.longitude
                            }
                        }
                    }

                    payload.bool.must.push(geo);

                    var sort = [
                        {
                            "_geo_distance": {
                                "coords": {
                                    "lat": result.result.latitude,
                                    "lon": result.result.longitude
                                },
                                "order": 'asc',
                                "unit": 'mi',
                                "distance_type": 'arc'
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

var widget = new BaseWidget('organisations');
