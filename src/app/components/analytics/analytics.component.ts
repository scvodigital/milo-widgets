import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';

@Component({
    selector: 'main-container.content',
    templateUrl: './analytics.component.html'
})
export class AnalyticsComponent {
    items: FirebaseListObservable<any[]>;

    constructor(db: AngularFireDatabase) {
        this.items = db.list('/analytics');
    }

}
