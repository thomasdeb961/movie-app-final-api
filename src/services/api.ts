import type { Movie, MovieApiResponse } from '../types/Movie';

const API_KEY = '5f5094246532b3a6bd329189c0b10a20';
const BASE_URL = 'https://api.themoviedb.org/3';

// --- API CALLS ---
async function fetchFromApi<T>(endpoint: string, params: string = ''): Promise<T> {
  const url = `${BASE_URL}${endpoint}?api_key=${API_KEY}&language=fr-FR${params}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
  return await response.json() as T;
}

// Ces fonctions appellent l'API pour récupérer les films populaires, les mieux notés, 
// les détails d'un film, les résultats de recherche, et les films par année
export async function fetchPopularMovies(page: number = 1): Promise<MovieApiResponse> {
  return fetchFromApi<MovieApiResponse>('/movie/popular', `&page=${page}`);
}

export async function fetchTopRatedMovies(page: number = 1): Promise<MovieApiResponse> {
  return fetchFromApi<MovieApiResponse>('/movie/top_rated', `&page=${page}`);
}

export async function fetchMovieDetails(id: number): Promise<Movie> {
  return fetchFromApi<Movie>(`/movie/${id}`);
}

export async function searchMovies(query: string, page: number = 1): Promise<MovieApiResponse> {
  return fetchFromApi<MovieApiResponse>('/search/movie', `&query=${encodeURIComponent(query)}&page=${page}`);
}

export async function fetchMoviesByYear(year: number, page: number = 1): Promise<MovieApiResponse> {
  return fetchFromApi<MovieApiResponse>('/discover/movie', `&primary_release_year=${year}&sort_by=popularity.desc&page=${page}`);
}
