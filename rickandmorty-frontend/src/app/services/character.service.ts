import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs'
import { ApiResponse, Character } from '../models/character.models';


@Injectable({
  providedIn: 'root'
})

export class CharacterService {
  private readonly apiUrl = 'http://localhost:8080/api/character';

  constructor (private http:HttpClient){  }

  getAllCharacters(page: number = 1, name : string = ''): Observable<ApiResponse>{
    let params = new HttpParams().set('page', page.toString());
    if(name){
      params = params.set('name', name);
    }
    return this.http.get<ApiResponse>(this.apiUrl, { params });
  }

  getCharacterById(id: number): Observable<Character> {
    return this.http.get<Character>(`${this.apiUrl}/${id}`);
  }
}
