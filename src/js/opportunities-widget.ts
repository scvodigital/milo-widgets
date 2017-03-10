import { BaseWidget } from './base-widget';
import * as searchTemplate from '../templates/opportunities-search.hbs';

class OpportunitiesWidget extends BaseWidget {
    constructor() { super('opportunities', searchTemplate) }
}

var widget = new OpportunitiesWidget();