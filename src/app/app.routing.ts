import { Routes } from '@angular/router';
import { AuthGuard } from './core/auth.guard';

import { BuilderComponent } from './components/builder/builder.component';
import { OrgBuilderComponent } from './components/builder/builder-organisation.component';
import { GoodHQBuilderComponent } from './components/builder/builder-goodhq.component';
import { GoodmovesBuilderComponent } from './components/builder/builder-goodmoves.component';
import { AnalyticsComponent } from './components/analytics/analytics.component';
import { LoginComponent } from './components/account/login.component';
import { ProfileComponent } from './components/account/profile.component';

export const rootRouterConfig: Routes = [
    { path: '', component: BuilderComponent, pathMatch: 'full' },
    { path: 'organisation-opportunities', component: OrgBuilderComponent },
    { path: 'goodhq', component: GoodHQBuilderComponent },
    { path: 'goodmoves', component: GoodmovesBuilderComponent },
    { path: 'analytics', component: AnalyticsComponent, canActivate: [AuthGuard] },
    { path: 'login', component: LoginComponent },
    { path: 'profile', component: ProfileComponent },
    { path: '**', component: BuilderComponent }
];
