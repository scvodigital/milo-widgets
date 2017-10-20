import { Component, OnInit, NgZone } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { AngularFireDatabase, AngularFireList } from 'angularfire2/database';
import { AuthService } from '../../services/auth.service';
import * as _ from 'lodash';

@Component({
    selector: 'main-container.content',
    templateUrl: './analytics.component.html'
})
export class AnalyticsComponent implements OnInit {
    opportunities: any[] = [];
    opportunities_global: GlobalUsage = new GlobalUsage();
    organisations: any[] = [];
    organisations_global: GlobalUsage = new GlobalUsage();

    suppressionList = [
        'localhost',
        'getinvolved.org.uk',
        'getinvolved.scot',
        'milo.scvo.org',
        'milo.scvo.org.uk',
        'widgets.scvo.org',
        'widgets.scvo.org.uk',
        'engage.projectstatus.in',
        'masoncross.net',
        'r.search.yahoo.com',
        'translate.googleusercontent.com',
        'user56117.vs.easily.co.uk',
        'vd.byzen.net'
    ];

    constructor(public auth: AuthService, public db: AngularFireDatabase) {}

    getAnalytics(): void {
        this.db.list<Item>('/analytics/opportunities').valueChanges().subscribe(dbResults => {
            this.opportunities = [];
            this.opportunities_global.searches = 0;
            this.opportunities_global.documents = 0;
            var opportunities_results = {};
            for (let i = 0; i < dbResults.length; i++) {
                for (var property in dbResults[i]) {
                    if (dbResults[i].hasOwnProperty(property)) {
                        var address = property.replace(/_/g, '.');
                        if (this.suppressionList.indexOf(address) === -1) {
                            // console.log("results for "+address);
                            // console.log(dbResults[i]);
                            // var type = dbResults[i].hasOwnProperty(property);
                            var filteredResults = dbResults[i][property];
                            var count = _.size(dbResults[i][property]);
                            if (opportunities_results[address] == undefined)
                            opportunities_results[address] = {};
                            // if (type == 'search') {
                                opportunities_results[address].address = address;
                                opportunities_results[address].searches = count;
                                this.opportunities_global.searches += count;
                            // } else if (type == 'document') {
                            //     opportunities_results[address].address = address;
                            //     opportunities_results[address].documents = count;
                            //     this.opportunities_global.documents += count;
                            // }
                        }
                    }
                }
            }
            for (var key in opportunities_results) {
                this.opportunities.push(opportunities_results[key]);
            }
            this.opportunities.sort(this.dynamicSort("-searches"));
        });

        this.db.list<Item>('/analytics/organisations').valueChanges().subscribe(dbResults => {
            this.organisations = [];
            this.organisations_global.searches = 0;
            this.organisations_global.documents = 0;
            var organisations_results = {};
            for (let i = 0; i < dbResults.length; i++) {
                for (var property in dbResults[i]) {
                    if (dbResults[i].hasOwnProperty(property)) {
                        var address = property.replace(/_/g, '.');
                        if (this.suppressionList.indexOf(address) === -1) {
                            // var type = dbResults[i].$key;
                            var count = _.size(dbResults[i][property]);
                            if (organisations_results[address] == undefined)
                            organisations_results[address] = {};
                            // if (type == 'search') {
                                organisations_results[address].address = address;
                                organisations_results[address].searches = count;
                                this.organisations_global.searches += count;
                            // } else if (type == 'document') {
                            //     organisations_results[address].address = address;
                            //     organisations_results[address].documents = count;
                            //     this.organisations_global.documents += count;
                            // }
                        }
                    }
                }
            }
            for (var key in organisations_results) {
                this.organisations.push(organisations_results[key]);
            }
            this.organisations.sort(this.dynamicSort("-searches"));
        });
    }

    dynamicSort(property) {
        var sortOrder = 1;
        if(property[0] === "-") {
            sortOrder = -1;
            property = property.substr(1);
        }
        return function (a,b) {
            var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
            return result * sortOrder;
        }
    }

    ngOnInit() {
        this.getAnalytics();
    }
}

export class Item {
    type?: string;
    count?: number;
}

export class GlobalUsage {
    searches?: number;
    documents?: number;
}
