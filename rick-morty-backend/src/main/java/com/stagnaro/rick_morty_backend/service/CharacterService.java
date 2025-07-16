package com.stagnaro.rick_morty_backend.service;

import com.stagnaro.rick_morty_backend.model.ApiResponse;
import com.stagnaro.rick_morty_backend.model.Character;
import com.stagnaro.rick_morty_backend.model.Episode;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CharacterService {
    private final WebClient webClient;

    public CharacterService(WebClient webClient) {
        this.webClient = webClient;
    }

    public Mono<ApiResponse> getAllCharacters(String page, String name) {
        return this.webClient.get()
                .uri(uriBuilder -> {
                    uriBuilder.path("/character").queryParam("page", page);
                    if (StringUtils.hasText(name)) {
                        uriBuilder.queryParam("name", name);
                    }
                    return uriBuilder.build();
                })
                .retrieve()
                .bodyToMono(ApiResponse.class)
                .flatMap(this::firstSeenCharacter)
                .onErrorResume(e -> {
                    System.err.println("Error en la API externa: " + e.getMessage());
                    return Mono.just(new ApiResponse());
                });
    }

    private Mono<Character> fetchEpisodesNames(Character character) {
        if (character.getEpisode() == null || character.getEpisode().isEmpty()) {
            character.setFirstSeenIn("N/A");
            character.setEpisodeNames(List.of("N/A"));
            return Mono.just(character);
        }

        Flux<Episode> episodeDetailsFlux = Flux.fromIterable(character.getEpisode())
                .flatMap(episodeUrl -> WebClient.create().get().uri(episodeUrl)
                        .retrieve()
                        .bodyToMono(Episode.class)
                        .onErrorResume(e -> Mono.empty()));

        return episodeDetailsFlux.collectList()
                .map(unorderedEpisodes -> {
                    unorderedEpisodes.sort(Comparator.comparingInt(Episode::getId));

                    List<String> sortedNames = unorderedEpisodes.stream()
                            .map(Episode::getName)
                            .collect(Collectors.toList());
                    character.setEpisodeNames(sortedNames);
                    character.setFirstSeenIn(sortedNames.isEmpty() ? "N/A" : sortedNames.get(0));
                    return character;
                });
    }

    private Mono<ApiResponse> firstSeenCharacter(ApiResponse response) {
        if (response.getResults() == null || response.getResults().isEmpty()) {
            return Mono.just(response);
        }

        Flux<Character> characters = Flux.fromIterable(response.getResults())
                .flatMap(this::fetchEpisodesNames);

        return characters.collectList()
                .map(fluxList -> {
                    fluxList.sort(Comparator.comparingInt(Character::getId));
                    response.setResults(fluxList);
                    return response;
                });
    }

    public Mono<Character> getCharacterById(int id) {
        return this.webClient.get()
                .uri("/character/{id}", id)
                .retrieve()
                .bodyToMono(Character.class);
    }
}