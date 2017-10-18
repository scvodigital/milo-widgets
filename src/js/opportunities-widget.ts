import * as jq from 'jquery';
import { BaseWidget, ResultSet, TemplateSet, MapOptions } from './base-widget';
import * as GoogleMapsLoader from 'google-maps'
import '../styles/milo.scss';

class OpportunitiesWidget extends BaseWidget {
    hideMap: boolean = true;
    style: string = 'basic';
    tsi: number;
    org: string;

    constructor() {
        super('');
        this.hideMap = this.scriptTag.data('hide-map') || true;
        this.style = this.scriptTag.data('widget-style');
        this.tsi = this.scriptTag.data('tsi');
        this.org = this.scriptTag.data('org');
    }
}

var widget = new BaseWidget('opportunities');
