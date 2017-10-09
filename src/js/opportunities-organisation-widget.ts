import * as jq from 'jquery';
import { BaseWidget, ResultSet, TemplateSet } from './base-widget';

class OpportunitiesOrganisationWidget extends BaseWidget {
    hideMap: boolean = true;
    org: string;

    constructor() {
        super('');
        this.org = this.scriptTag.data('org');
    }
}

var widget = new BaseWidget('opportunities-organisation');
