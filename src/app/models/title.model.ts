export interface TitleEpisode {
    episode_number: number;
    name: string;
    air_date?: string;
}

export interface TitleSeason {
    season_number: number;
    name?: string;
    episode_count?: number;
    air_date?: string;
    episodes?: TitleEpisode[];
}

export interface TitleEpisodeAiring {
    episode_number?: number;
    season_number?: number;
    name?: string;
    air_date?: string;
}

export interface Title {
    poster_path: string;
    id: number;
    media_type: string;
    vote_average: number;
    runtime: number;
    original_language: string;
    language: string;
    overview: string;
    genres: object[];
    tagline: string;
    external_ids: any;
    certification: string;
    videos: any;
    trailer: string;
    runtimeText: string;
    awards: string;
    watchlistAddDate: Date;
    watchlistDocId: string;
    lovelistAddDate: Date;
    lovelistDocId: string;
    year: any;
    streams: any;

    // TV-Specific
    first_air_date: Date;
    name: string;
    content_ratings: object[];
    number_of_seasons: number;
    seasons?: TitleSeason[];
    next_episode_to_air?: TitleEpisodeAiring | null;
    episode_run_time?: number[];

    // Movie-Specific
    release_date: Date;
    title: string;
    release_dates: any; // used for certification

    // Other ratings
    metaScore: number;
    imdbScore: number;
    imdb232Score: number;
    imdb232Votes: number;
    rottenScore: number;

    scoreCount: number;
    totalScore: number;
    averageScore: number;

    rottenImage: string;
    omdbPoster: string;
    ratingsHydrated: boolean;
    popularTmdbScore: number;
    popularMoviesDatabaseScore: number;
    popularCombinedScore: number;

    // Streams
    'watch/providers': any;
    onNetflix: boolean;
    onHulu: boolean;
    onDisney: boolean;
    onAmazon: boolean;
    onYoutube: boolean;
    onApple: boolean;
    onPeacock: boolean;
    onMax: boolean;
    onParamount: boolean;
    onStarz: boolean;
    onAmc: boolean;
    onMgm: boolean;
}
