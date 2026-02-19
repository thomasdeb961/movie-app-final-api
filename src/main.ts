import { fetchPopularMovies, fetchTopRatedMovies, fetchMovieDetails, searchMovies, fetchMoviesByYear } from './services/api';
import type { Movie } from './types/Movie';
import './style.css';

// --- DOM ELEMENTS ---
const mainContent = document.getElementById('main-content') as HTMLElement;
const loadMoreContainer = document.getElementById('load-more-container') as HTMLElement; 
const loadMoreBtn = document.getElementById('load-more-btn') as HTMLButtonElement;
const sortSelect = document.getElementById('sort-select') as HTMLSelectElement;
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const yearInput = document.getElementById('year-input') as HTMLInputElement;

// --- STATE ---
let favorites: Movie[] = JSON.parse(localStorage.getItem('myFavorites') || '[]');
let compareList: Movie[] = [];
let currentMovies: Movie[] = [];
let currentPage = 1;
let currentMode: string = 'POPULAR'; // POPULAR, TOP_RATED, SEARCH, YEAR, FAVORITES
let currentQuery = '';

// --- INITIALISATION UI ---
const compareBar = document.createElement('div');
compareBar.className = 'compare-bar';
compareBar.innerHTML = `<span id="comp-count" style="color:white; font-weight:bold;">0 films</span><button id="btn-compare" style="display:none; padding:8px 16px; background:var(--accent-color); border:none; color:white; border-radius:4px; cursor:pointer;">COMPARER</button>`;
document.body.appendChild(compareBar);

// --- FONCTIONS GÉNÉRIQUES (Le coeur du code) ---

async function loadMovies(mode: string, apiCall: () => Promise<any>, reset = true) {
    if (reset) {
        currentMode = mode;
        currentPage = 1;
        mainContent.innerHTML = '<div class="loader"></div>';
        document.querySelectorAll('.nav-links button').forEach(b => b.classList.remove('active'));
        if (mode === 'POPULAR') document.getElementById('nav-popular')?.classList.add('active');
        if (mode === 'TOP_RATED') document.getElementById('nav-toprated')?.classList.add('active');
        
        // CORRECTION ICI : On affiche ou on cache le conteneur du bouton
        loadMoreContainer.style.display = mode === 'FAVORITES' ? 'none' : 'flex';
    }
    
    try {
        const data = await apiCall();
        const results = mode === 'FAVORITES' ? favorites : data.results;
        renderGrid(results, getTitle(mode), !reset);
    } catch (e) { console.error(e); mainContent.innerHTML = '<p>Erreur de chargement.</p>'; }
}

function getTitle(mode: string) {
    if (mode === 'SEARCH') return `Recherche: "${currentQuery}"`;
    if (mode === 'YEAR') return `Année: ${currentQuery}`;
    if (mode === 'FAVORITES') return 'Mes Favoris ❤️';
    return mode === 'POPULAR' ? 'Films Populaires' : 'Mieux Notés';
}

function renderGrid(movies: Movie[], title: string, append: boolean) {
    document.getElementById('stats-counter')!.textContent = `${movies.length} affichés`;
    if (!append) {
        currentMovies = movies;
        mainContent.innerHTML = `<h2 style="text-align:center">${title}</h2><div class="grid-container"></div>`;
    } else {
        currentMovies = [...currentMovies, ...movies];
    }

    const grid = document.querySelector('.grid-container')!;
    if (movies.length === 0) {
        grid.innerHTML = '<p style="text-align:center; grid-column: 1 / -1;">Aucun résultat.</p>';
        loadMoreContainer.style.display = 'none'; // Cache le bouton si plus de résultats
    }

    movies.forEach(movie => {
        const card = document.createElement('article');
        card.className = 'movie-card';
        const isFav = favorites.some(f => f.id === movie.id);
        const isComp = compareList.some(c => c.id === movie.id);
        
        card.innerHTML = `
            <div class="card-actions">
                <button class="action-btn fav-btn ${isFav ? 'active' : ''}">${isFav ? '❤️' : '🤍'}</button>
                <button class="action-btn comp-btn ${isComp ? 'active' : ''}">VS</button>
            </div>
            <img src="${movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://placehold.co/500x750?text=Pas+d+image'}" alt="${movie.title}">
            <div class="movie-info"><h3>${movie.title}</h3><span class="rating">⭐ ${movie.vote_average.toFixed(1)}</span></div>
        `;
        
        card.querySelector('.fav-btn')?.addEventListener('click', (e) => { e.stopPropagation(); toggleFav(movie); });
        card.querySelector('.comp-btn')?.addEventListener('click', (e) => { e.stopPropagation(); toggleComp(movie); });
        card.addEventListener('click', () => renderDetail(movie.id));
        grid.appendChild(card);
    });
}

// --- LOGIQUE MÉTIER ---

function toggleFav(m: Movie) {
    const idx = favorites.findIndex(f => f.id === m.id);
    idx === -1 ? favorites.push(m) : favorites.splice(idx, 1);
    localStorage.setItem('myFavorites', JSON.stringify(favorites));
    if (currentMode === 'FAVORITES') loadMovies('FAVORITES', async () => ({ results: favorites }));
    else renderGrid(currentMovies, getTitle(currentMode), false); 
}

function toggleComp(m: Movie) {
    const idx = compareList.findIndex(c => c.id === m.id);
    if (idx === -1 && compareList.length < 2) compareList.push(m);
    else if (idx !== -1) compareList.splice(idx, 1);
    else alert("Max 2 films !");
    
    document.getElementById('comp-count')!.textContent = `${compareList.length} films`;
    compareBar.classList.toggle('visible', compareList.length > 0);
    document.getElementById('btn-compare')!.style.display = compareList.length === 2 ? 'block' : 'none';
}

function handleSort() {
    const sort = sortSelect.value;
    let sorted = [...currentMovies];
    if (sort === 'AZ') sorted.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === 'ZA') sorted.sort((a, b) => b.title.localeCompare(a.title));
    if (sort === 'RATING') sorted.sort((a, b) => a.vote_average - b.vote_average);
    
    const grid = document.querySelector('.grid-container')!;
    grid.innerHTML = '';
    renderGrid(sorted, getTitle(currentMode), true); 
}

// --- DETAILS & COMPARE VIEWS ---

async function renderDetail(id: number) {
    loadMoreContainer.style.display = 'none';
    mainContent.innerHTML = '<div class="loader"></div>';
    const m = await fetchMovieDetails(id);
    mainContent.innerHTML = `
        <div class="movie-detail">
            <div class="hero-banner" style="background-image: url('https://image.tmdb.org/t/p/original${m.poster_path}')"></div>
            <div class="hero-content">
                <img src="https://image.tmdb.org/t/p/w500${m.poster_path}" style="width:200px; border-radius:10px; box-shadow: 0 5px 15px rgba(0,0,0,0.5);">
                <div class="info-wrapper">
                    <h1>${m.title}</h1>
                    <p>${m.release_date} | ${m.vote_average} ⭐</p>
                    <p>${m.overview}</p>
                    <button onclick="location.reload()" style="margin-top:20px; padding:10px 20px; cursor:pointer; background:var(--bg-input); color:var(--text-main); border:none; border-radius:4px;">⬅ Retour</button>
                </div>
            </div>
        </div>`;
}

async function renderCompare() {
    loadMoreContainer.style.display = 'none'; 
    const [m1, m2] = await Promise.all(compareList.map(m => fetchMovieDetails(m.id)));
    const tpl = (m: Movie, win: boolean) => `
        <div class="compare-card" style="border: ${win ? '2px solid #4cd137' : 'none'}">
            <img src="https://image.tmdb.org/t/p/w300${m.poster_path}" width="150" style="border-radius:8px; margin-bottom:1rem;">
            <h3>${m.title}</h3><p>⭐ ${m.vote_average.toFixed(1)}</p><p>📅 ${m.release_date}</p>
        </div>`;
    
    mainContent.innerHTML = `
        <h2 style="text-align:center">Comparatif</h2>
        <div class="compare-container" style="display:flex; justify-content:center; gap:20px;">
            ${tpl(m1, m1.vote_average > m2.vote_average)}
            ${tpl(m2, m2.vote_average > m1.vote_average)}
        </div>
        <button onclick="location.reload()" style="display:block; margin:20px auto; padding:10px 20px; background:var(--accent-color); color:white; border:none; border-radius:4px; cursor:pointer;">Retour à l'accueil</button>
    `;
}

// --- EVENTS ---
document.getElementById('nav-popular')!.onclick = () => loadMovies('POPULAR', () => fetchPopularMovies(1));
document.getElementById('nav-toprated')!.onclick = () => loadMovies('TOP_RATED', () => fetchTopRatedMovies(1));
document.getElementById('nav-favorites')!.onclick = () => loadMovies('FAVORITES', async () => ({ results: favorites }));

document.getElementById('search-btn')!.onclick = () => { 
    currentQuery = searchInput.value; 
    if(currentQuery) loadMovies('SEARCH', () => searchMovies(currentQuery, 1)); 
};

document.getElementById('year-btn')!.onclick = () => { 
    currentQuery = yearInput.value; 
    if(currentQuery) loadMovies('YEAR', () => fetchMoviesByYear(+currentQuery, 1)); 
};

document.getElementById('btn-compare')!.onclick = renderCompare;
sortSelect.onchange = handleSort;

// GESTION DU BOUTON VOIR PLUS
loadMoreBtn.onclick = () => {
    currentPage++;
    const originalText = loadMoreBtn.textContent;
    loadMoreBtn.textContent = 'Chargement...';
    
    let apiCall;
    if (currentMode === 'POPULAR') apiCall = () => fetchPopularMovies(currentPage);
    else if (currentMode === 'TOP_RATED') apiCall = () => fetchTopRatedMovies(currentPage);
    else if (currentMode === 'SEARCH') apiCall = () => searchMovies(currentQuery, currentPage);
    else if (currentMode === 'YEAR') apiCall = () => fetchMoviesByYear(+currentQuery, currentPage);

    if (apiCall) {
        apiCall().then(data => {
            renderGrid(data.results, getTitle(currentMode), true);
            loadMoreBtn.textContent = originalText;
        });
    }
};

// Thème & Init
document.getElementById('theme-toggle')!.onclick = () => {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
};
if (localStorage.getItem('theme') === 'light') document.body.classList.add('light-mode');

// Lancement
loadMovies('POPULAR', () => fetchPopularMovies(1));
