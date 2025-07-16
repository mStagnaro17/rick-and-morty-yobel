package com.stagnaro.rick_morty_backend.model;

import com.stagnaro.rick_morty_backend.model.Character;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ApiResponse {
    private Info info;
    private List<Character> results;
}
