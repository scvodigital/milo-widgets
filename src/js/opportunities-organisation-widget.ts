import * as jq from 'jquery';
import { BaseWidget, ResultSet, TemplateSet } from './base-widget';
import '../styles/milo.scss';

class OpportunitiesOrganisationWidget extends BaseWidget {
    hideMap: boolean = true;
    style: string = 'basic';
    org: string;

    constructor() {
        super('');
        this.org = this.scriptTag.data('org');
        this.style = this.scriptTag.data('style');
    }
}

var widget = new BaseWidget('opportunities-organisation');
