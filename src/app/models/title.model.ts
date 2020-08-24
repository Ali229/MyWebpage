export interface Title {
  poster_path: string;
  id: number;
  media_type: string;
  vote_average: number;
  runtime: number;
  original_language: string;
  overview: string;
  genres: object[];
  tagline: string;
  external_ids: any;
  certification: string;
  videos: any;
  trailer: string;

  // TV-Specific
  first_air_date: Date;
  name: string;
  content_ratings: object[];

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
}
