import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MainComponent } from './main/main.component';
import { PmcforthcomingComponent } from './pmcforthcoming/pmcforthcoming.component';
import { TitlechangeComponent } from './titlechange/titlechange.component';

const routes: Routes = [
  { path: '', component: MainComponent },
  { path: 'pmcforthcoming', component: PmcforthcomingComponent },
  { path: 'titlechange', component: TitlechangeComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
