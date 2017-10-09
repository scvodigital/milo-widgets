import * as jq from 'jquery';
import { BaseWidget, ResultSet, TemplateSet } from './base-widget';

class OpportunitiesOrganisationsWidget extends BaseWidget {
    hideMap: boolean = true;

    constructor() {
        super('');
    }
}

var widget = new BaseWidget('opportunities-organisations');
