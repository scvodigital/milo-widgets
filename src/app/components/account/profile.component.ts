import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {

    constructor(public auth: AuthService) { }

    logout() {
        this.auth.signOut();
    }

    ngOnInit() {}
}
