export interface Info {
    count : number;
    pages : number;
    next : string | null;
    prev : string | null;
}

export interface Origin {
    name : string; 
    url : string;
}

export interface Location {
    name : string;
    url : string;
}

export interface Character {
    id : number;
    name : string;
    status : string;
    species : string;
    type : string;
    gender : string;
    origin : Origin;
    location : Location;
    image : string;
    episode : string[];
    firstSeenIn : string;
    episodeNames: string[];
}

export interface ApiResponse {
    info : Info
    results : Character[];
}