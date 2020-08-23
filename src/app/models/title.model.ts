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

  // TV-Specific
  first_air_date: Date;
  name: string;

  // Movie-Specific
  release_date: Date;
  title: string;

  metaColor: string;
  imdbColor: string;
  rottenColor: string;
  tmdbColor: string;
  averageColor: string;

  tmdbScore: number;
  rottenScore: number;
  scoreCount: number;
  totalScore: number;
  averageScore: number;

  rottenImage: string;
}
