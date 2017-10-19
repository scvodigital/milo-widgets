import * as jq from 'jquery';
import { BaseWidget, ResultSet, TemplateSet, MapOptions } from './base-widget';
import * as GoogleMapsLoader from 'google-maps'
import '../styles/milo.scss';

class OrganisationWidget extends BaseWidget {
    hideMap: boolean = true;
    style: string = 'basic';
    tsi: number;
    strive: boolean = false;

    constructor() {
        super('');
        this.hideMap = this.scriptTag.data('hide-map') || true;
        this.style = this.scriptTag.data('widget-style');
        this.tsi = this.scriptTag.data('tsi');
        this.strive = this.scriptTag.data('strive');

        if (this.style == 'enhanced') {
            $("#mw-organisations-search-button").click(function() {
                var $map = $("#mw-organisations-map");
                var startPosition = $map[0].offsetTop;
                $(window).scroll(function(){
                    var newPosition = $(window).scrollTop() - startPosition + 15;
                    if (newPosition > 0) {
                        $map.stop().animate({"marginTop": newPosition + "px"}, "slow");
                    } else {
                        $map.stop().animate({"marginTop": "0px"}, "slow");
                    }
                });
            });
        }
    }
}

var widget = new BaseWidget('organisations');
