import * as jq from 'jquery';
import { BaseWidget, ResultSet } from './base-widget';
import * as SearchTemplate from '../templates/opportunities-search.hbs';
import * as ResultsTemplate from '../templates/opportunities-results.hbs';

import * as GoogleMapsLoader from 'google-maps'

class OpportunitiesWidget extends BaseWidget {
    tsi: number;
    hideMap: boolean = false;
    map: google.maps.Map;
    markers: google.maps.Marker[] = [];
    scotland = { lat: 56.85132, lng: -4.1180987 };

    constructor() {
        super('opportunities', 'volunteering-opportunity', ['workType', 'clientGroup'], SearchTemplate, ResultsTemplate);
        this.tsi = this.scriptTag.data('tsi');
        this.hideMap = this.scriptTag.data('hide-map') || false;

        if (!this.hideMap) {
            (<any>GoogleMapsLoader)['KEY'] = 'AIzaSyBGANoz_QO2iBbM-j1LIvkdaH6ZKnqgTfA';
            (<any>GoogleMapsLoader)['LIBRARIES'] = ['geometry', 'places'];
        }
    }

    bindControls() {
        var __this = this;
        jq('#mw-opportunities-show-hide-opening-times').off('click').on('click', function () {
            jq('.mw-opportunities-times').toggleClass('hide');
        });

        jq('.mw-opportunities-result .panel-heading').off('click').on('click', function (event) {
            var $this = jq(this);
            var body = $this.next('.panel-collapse');
            body.toggleClass('hide');
        });

        jq('#mw-opportunities-search').off('click').on('click', function () {
            __this.doSearch();
        });

        this.searchElement.find('.pager button').off('click').on('click', function (event: JQueryEventObject) {
            var page = jq(event.currentTarget).data('search');
            __this.doSearch(page);
        });

        jq('[data-toggle="print"]').off('click').on('click', function () {
            var $this = jq(this);
            var id = $this.data('id');
            __this.print(id);
        });

        jq('#mw-opportunities-expand-collapse-all').off('click').on('click', function () {
            var total = jq('.mw-opportunities-result .panel-collapse').length;
            var closed = jq('.mw-opportunities-result .panel-collapse.hide').length;

            var half = Math.floor(total / 2);

            if (closed < half) {
                jq('.mw-opportunities-result .panel-collapse').addClass('hide');
            } else {
                jq('.mw-opportunities-result .panel-collapse').removeClass('hide');
            }
        });

        if(this.hideMap){
            jq('#mw-opportunities-map').hide();
        }
        this.setupMap();
    }

    doSearch(page: number = 1) {
        var query = jq('#mw-opportunities-query').val();
        var distance = jq('#mw-opportunities-distance').val();
        var postcode = jq('#mw-opportunities-user-postcode').val();
        var activity = jq('#mw-opportunities-activity').val();
        var clientGroup = jq('#mw-opportunities-client-group').val();
        var timesCheckboxes = jq('[data-bind="Times"]:checked');
        var openingTimes = timesCheckboxes.toArray().map((time: any) => { return time.defaultValue });

        var must = [];

        if (activity !== '') {
            must.push({ term: { workType: activity } });
        }

        if (clientGroup !== '') {
            must.push({ term: { clientGroup: clientGroup } });
        }

        if (this.tsi) {
            must.push({ term: { tsiLegacyRef: this.tsi } });
        }

        if (openingTimes && openingTimes.length > 0) {
            var timesOr: { term: { [field: string]: boolean } }[] = [];
            timesOr = openingTimes.map((time) => {
                return { term: { [time]: true } }
            });
            must.push({
                bool: {
                    should: timesOr,
                    minimum_should_match: 1
                }
            })
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

        if (distance && distance > 0 && postcode) {
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
                this.search(payload, page).then((resultSet: ResultSet) => { this.placeMarkers(resultSet); });
            });
        } else {
            this.search(payload, page).then((resultSet: ResultSet) => { this.placeMarkers(resultSet); });
        }
    }

    print(id) {
        var container = jq('#mw-opportunities-result-panel-' + id);
        var title = container.find('.panel-title').text();
        var content = container.html();
        var template = `
            <html>
                </head>
                    <title>${title}</title>
                    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" />
                    <style>
                        .mw-emoji{
                            display: inline-block;
                            font-size: 1.5em;
                            width: 1.5em;
                            line-height: 1.5em;
                            text-align: center;
                            font-weight: bold;
                            vertical-align: middle;
                        }

                        .btn, .mw-emoji.pull-right{
                            display: none;
                        }

                        .dl-horizontal dt, .dl-horizontal dd{
                            line-height:1.5em;
                            vertical-align:middle;
                        }

                        .dl-horizontal dt {
                            text-align: left;
                        }

                        .dl-horizontal dd {
                            padding-top: 0.25em;
                        }

                        h1 span.mw-emoji.pull-right, h2 span.mw-emoji.pull-right, h3 span.mw-emoji.pull-right, h4 span.mw-emoji.pull-right {
                            margin-top: -0.5em;
                        }
                    </style>
                </head>
                <body>
                    ${content}
                    <script>
                        window.print();
                        var me = window.parent.document.getElementById('print-frame-${id}');
                        me.parentNode.removeChild(window.parent.document.getElementById('print-frame-${id}'));
                    </script>
                </body>
            </html>`;
        console.log(container);
        var frame = jq('<iframe />', {
            src: 'about:blank',
            border: 0,
            id: 'print-frame-' + id
        }).css({
            width: 800,
            height: 800,
            visibility: 'hidden'
        }).appendTo('body');

        var iframe = (<any>frame.get(0)).contentWindow;
        iframe.document.write(template);
        iframe.focus();
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
                        var details = jq('#mw-opportunities-result-' + result.Id);
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
                    this.map = new google.maps.Map(jq('#mw-opportunities-map')[0], {
                        zoom: 6,
                        center: this.scotland
                    });
                });
            }
        }
    }
}

var widget = new OpportunitiesWidget();