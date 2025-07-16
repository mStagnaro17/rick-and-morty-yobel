import { Component, OnInit } from '@angular/core';
import { Character } from '../../models/character.models';
import { Observable,switchMap } from 'rxjs';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CharacterService } from '../../services/character.service';

@Component({
  selector: 'app-character-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './character-detail.html',
  styleUrl: './character-detail.css'
})
export class CharacterDetailComponent implements OnInit {
  
  character$!: Observable<Character>;

  constructor(
    private route: ActivatedRoute,
    private CharacterService: CharacterService
  ){}

  ngOnInit(): void {
    this.character$ = this.route.paramMap.pipe(
      switchMap(params => {
        const id = Number(params.get('id'));
        return this.CharacterService.getCharacterById(id);
      })
    );
  }

}
