import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccueilComponent } from './pages/accueil/accueil.component';
import { LexiqueComponent } from './pages/lexique/lexique.component';
import { ConfigsComponent } from './pages/configs/configs.component';

const routes: Routes = [
  { path: '', component: AccueilComponent },
  { path: 'lexique', component: LexiqueComponent },
  { path: 'configs', component: ConfigsComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
