import { Routes } from '@angular/router';
import { CharacterListComponent } from './components/character-list/character-list'
import { CharacterDetailComponent } from './components/character-detail/character-detail';
import { NotFoundComponent } from './components/not-found/not-found';

export const routes: Routes = [
    { path: '', redirectTo: '/character', pathMatch: 'full'},

    { path: 'character', component:CharacterListComponent},

    { path: '**', component: NotFoundComponent}
];
