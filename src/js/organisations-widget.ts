import * as jq from 'jquery';
import { BaseWidget, ResultSet } from './base-widget';
import * as SearchTemplate from '../templates/organisations-search.hbs';
import * as ResultsTemplate from '../templates/organisations-results.hbs';

import * as GoogleMapsLoader from 'google-maps'

class OrganisationWidget extends BaseWidget {
    tsi: number;
    hideMap: boolean = false;
    map: google.maps.Map;
    markers: google.maps.Marker[] = [];
    scotland = { lat: 56.85132, lng: -4.1180987 };

    constructor() {
        super('organisations', 'milo-organisation', ['mainActivitiesGlobal'], SearchTemplate, ResultsTemplate);
        this.tsi = this.scriptTag.data('tsi');
        this.hideMap = this.scriptTag.data('hide-map') || false;

        (<any>GoogleMapsLoader)['KEY'] = 'AIzaSyBGANoz_QO2iBbM-j1LIvkdaH6ZKnqgTfA';
        (<any>GoogleMapsLoader)['LIBRARIES'] = ['geometry', 'places'];
    }

    bindControls() {
        jq('#mw-organisations-search').off('click').on('click', () => {
            this.doSearch();
        });
        jq('#mw-organisations-expand-collapse-all').off('click').on('click', () => {
            var total = jq('.mw-organisations-result .panel-collapse').length;
            var closed = jq('.mw-organisations-result .panel-collapse.hide').length;

            var half = Math.floor(total / 2);

            if (closed < half) {
                jq('.mw-organisations-result .panel-collapse').addClass('hide');
            } else {
                jq('.mw-organisations-result .panel-collapse').removeClass('hide');
            }
        });
        jq('.mw-organisations-result .panel-heading').off('click').on('click', function (event) {
            var $this = jq(this);
            var body = $this.next('.panel-collapse');
            body.toggleClass('hide');
        });
        jq('#mw-organisations-query').off('keypress').on('keypress', (event) => {
            if (event.which === 13) {
                this.doSearch();
            }
        });
        this.searchElement.find('.pager button').off('click').on('click', (event: JQueryEventObject) => {
            var page = jq(event.currentTarget).data('search');
            console.log(page);
            this.doSearch(page);
        });

        if(this.hideMap){
            jq('#mw-opportunities-map').hide();
        }

        this.setupMap();
    }

    doSearch(page: number = 1) {
        var query = jq('#mw-organisations-query').val();
        var activity = jq('#mw-organisations-activity').val();

        var must = [];

        if (activity !== '') {
            must.push({ term: { mainActivitiesGlobal_slugs: activity } });
        }

        if (this.tsi) {
            must.push({ term: { tsiLegacyRef: this.tsi } });
        }

        if (query !== '') {
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

        this.search(payload, page).then((resultSet: ResultSet) => { this.placeMarkers(resultSet); });
    }

    placeMarkers(resultSet: ResultSet) {
        if (!this.hideMap) {
            this.markers.forEach((marker: google.maps.Marker) => {
                marker.setMap(null);
            });
            this.markers = [];
            var bounds = new google.maps.LatLngBounds();
            resultSet.results.forEach((result) => {
                if (result.geo_coords) {
                    var coords = { lat: result.geo_coords.lat, lng: result.geo_coords.lon };
                    var marker = new google.maps.Marker({
                        position: coords,
                        map: this.map,
                        title: result.name
                    });
                    marker.addListener('click', (event) => {
                        var details = jq('#mw-organisations-result-' + result.Id);
                        details.removeClass('hide');
                        window.scrollTo(0, details.offset().top - 50);
                    });
                    bounds.extend(coords);
                    this.markers.push(marker);
                }
            });
            if (this.markers.length === 0) {
                this.map.setCenter(this.scotland);
                this.map.setZoom(6);
            } else {
                this.map.fitBounds(bounds);
            }
        }
    }

    setupMap() {
        if (!this.hideMap) {
            if (!this.map) {
                GoogleMapsLoader.load((google) => {
                    this.map = new google.maps.Map(jq('#mw-organisations-map')[0], {
                        zoom: 6,
                        center: this.scotland
                    });
                });
            }
        }
    }
}

var widget = new OrganisationWidget();