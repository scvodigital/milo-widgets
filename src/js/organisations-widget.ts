import { BaseWidget } from './base-widget';
import * as searchTemplate from '../templates/organisations-search.hbs';

class OrganisationWidget extends BaseWidget {
    constructor() {
        super('organisations', searchTemplate);
        this.search({
            index: 'charter-test',
            type: 'signatory',
            query: {
                match_all: {}
            }
        }).then((results) => {

        });
    }
}

var widget = new OrganisationWidget();