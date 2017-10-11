import * as jq from 'jquery';
import { BaseWidget, ResultSet, TemplateSet } from './base-widget';
import '../styles/milo.scss';

class OpportunitiesOrganisationsWidget extends BaseWidget {
    hideMap: boolean = true;

    constructor() {
        super('');
    }
}

var widget = new BaseWidget('opportunities-organisations');
