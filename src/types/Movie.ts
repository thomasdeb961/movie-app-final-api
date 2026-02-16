export interface Genre {
  id: number;
  name: string;
}

export interface Country {
  iso_3166_1: string;
  name: string;
}

export interface Movie {
  id: number;
  title: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
  overview: string;
  runtime?: number; 
  genres?: Genre[];
  production_countries?: Country[];
  vote_count?: number;
}

export interface MovieApiResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}