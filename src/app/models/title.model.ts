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
    year: any;
    streams: any;

    // TV-Specific
    first_air_date: Date;
    name: string;
    content_ratings: object[];
    number_of_seasons: number;

    // Movie-Specific
    release_date: Date;
    title: string;
    release_dates: any; // used for certification

    // Other ratings
    metaScore: number;
    imdbScore: number;
    rottenScore: number;

    scoreCount: number;
    totalScore: number;
    averageScore: number;

    rottenImage: string;
    omdbPoster: string;

    // Streams
    'watch/providers': any;
    onNetflix: boolean;
    onHulu: boolean;
    onDisney: boolean;
    onAmazon: boolean;
    onYoutube: boolean;
    onApple: boolean;
    onSling: boolean;
    onPeacock: boolean;
    onMax: boolean;
}
