/* Routes */
import { rootRouterConfig } from "./app.routing";

/* Modules */
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { RouterModule } from "@angular/router";
import { BrowserModule, Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AngularFireModule } from 'angularfire2';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { environment } from '../environments/environment.prod';
import { AuthService } from './services/auth.service';
import { AuthGuard } from './core/auth.guard';

/* Components */
import { AppComponent } from './app.component';
import { BuilderComponent } from './components/builder/builder.component';
import { PreviewComponent } from './components/builder/preview.component';
import { OrgBuilderComponent } from './components/builder/builder-organisation.component';
import { GoodHQBuilderComponent } from './components/builder/builder-goodhq.component';
import { GoodmovesBuilderComponent } from './components/builder/builder-goodmoves.component';
import { AnalyticsComponent } from './components/analytics/analytics.component';
import { LoginComponent } from './components/account/login.component';
import { ProfileComponent } from './components/account/profile.component';

@NgModule({
    imports: [
        BrowserModule,
        AngularFireModule.initializeApp(environment.firebase),
        AngularFireAuthModule,
        AngularFireDatabaseModule,
        HttpModule,
        FormsModule,
        RouterModule.forRoot(rootRouterConfig)
    ],
    declarations: [
        AppComponent,
        BuilderComponent,
        PreviewComponent,
        OrgBuilderComponent,
        GoodHQBuilderComponent,
        GoodmovesBuilderComponent,
        AnalyticsComponent,
        LoginComponent,
        ProfileComponent
    ],
    providers: [
        AuthService,
        AuthGuard
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}
