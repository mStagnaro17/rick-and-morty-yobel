package com.stagnaro.rick_morty_backend.controller;


import com.stagnaro.rick_morty_backend.model.ApiResponse;
import com.stagnaro.rick_morty_backend.model.Character;
import com.stagnaro.rick_morty_backend.service.CharacterService;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;


@RestController
@RequestMapping("/api/character")
@CrossOrigin(origins="http://localhost:4200")
public class CharacterController {
    private final CharacterService characterService;

    public CharacterController(CharacterService characterService)
    {
        this.characterService = characterService;
    }

    @GetMapping
    public Mono<ApiResponse> getAllCharacters(
            @RequestParam(defaultValue = "1") String page,
            @RequestParam(required = false) String name){
        return characterService.getAllCharacters(page, name);
    }

    @GetMapping("/{id}")
    public Mono<Character> getCharacterById(@PathVariable int id)
    {
        return characterService.getCharacterById(id);
    }
}


