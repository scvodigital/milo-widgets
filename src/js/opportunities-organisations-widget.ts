import * as jq from 'jquery';
import { BaseWidget, ResultSet, TemplateSet } from './base-widget';
import '../styles/milo.scss';

class OpportunitiesOrganisationsWidget extends BaseWidget {
    hideMap: boolean = true;
    style: string = 'basic';

    constructor() {
        super('');
        this.style = this.scriptTag.data('widget-style');
    }
}

var widget = new BaseWidget('opportunities-organisations');
