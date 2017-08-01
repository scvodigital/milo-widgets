import { Routes } from '@angular/router';

import { BuilderComponent } from './components/builder/builder.component';
import { OrgBuilderComponent } from './components/builder/builder-organisation.component';

export const rootRouterConfig: Routes = [
    { path: '', component: BuilderComponent, pathMatch: 'full' },
    { path: 'organisation-opportunities', component: OrgBuilderComponent },
    { path: '**', component: BuilderComponent }
];
