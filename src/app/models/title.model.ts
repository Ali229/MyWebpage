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

  // TV-Specific
  first_air_date: Date;
  name: string;

  // Movie-Specific
  release_date: Date;
  title: string;

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
