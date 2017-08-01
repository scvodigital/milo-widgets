import { Component, OnInit, HostBinding } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from 'angularfire2/auth';
// Do not import from 'firebase' as you'd lose the tree shaking benefits
import * as firebase from 'firebase/app'
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {

    constructor(public auth: AuthService, private router: Router) {}

    private afterSignIn(): void {
        // Do after login stuff here, such router redirects, toast messages, etc.
        this.router.navigate(['/profile']);
    }

    signInWithGithub(): void {
        this.auth.githubLogin()
        .then(() => this.afterSignIn());
    }

    ngOnInit() {}
}
