/* Routes */
import { rootRouterConfig } from "./app.routing";

/* Modules */
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { RouterModule } from "@angular/router";
import { BrowserModule, Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

/* Components */
import { AppComponent } from './app.component';
import { BuilderComponent } from './components/builder/builder.component';
import { PreviewComponent } from './components/builder/preview.component';
import { OrgBuilderComponent } from './components/builder/builder-organisation.component';

/* Configuration */
import { firebaseConfig } from './configuration/firebase';

@NgModule({
    imports: [
        BrowserModule,
        HttpModule,
        FormsModule,
        RouterModule.forRoot(rootRouterConfig)
    ],
    declarations: [
        AppComponent,
        BuilderComponent,
        PreviewComponent,
        OrgBuilderComponent
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {}
