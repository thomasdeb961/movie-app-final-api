/* eslint-disable @typescript-eslint/no-unused-expressions */
// importation et liaison des fichiers
import { fetchPopularMovies, fetchTopRatedMovies, fetchMovieDetails, searchMovies, fetchMoviesByYear } from './services/api';
import type { Movie } from './types/Movie';
import './style.css';

// Récuperer les balises avec leur id pour les utiliser dans le code et les manipuler
// les htmlelement sont typés pour éviter les erreurs de typescript 
const mainContent = document.getElementById('main-content') as HTMLElement;
const loadMoreContainer = document.getElementById('load-more-container') as HTMLElement; 
const loadMoreBtn = document.getElementById('load-more-btn') as HTMLButtonElement;
const sortSelect = document.getElementById('sort-select') as HTMLSelectElement;
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const yearInput = document.getElementById('year-input') as HTMLInputElement;

// Variables globales pour stocker l'état de l'application a partir du local 
// et éviter les appels API redondants
const favorites: Movie[] = JSON.parse(localStorage.getItem('myFavorites') || '[]');
const compareList: Movie[] = [];
let currentMovies: Movie[] = [];
let currentPage = 1;
let currentMode: string = 'POPULAR'; // POPULAR, TOP_RATED, SEARCH, YEAR, FAVORITES
let currentQuery = '';

// on va pouvoir comparer les films, on affiche une barre de comparaison en bas 
// de l'écran avec un compteur et un bouton pour lancer la comparaison
// (appendchild) pour insérer un élément dans l'autre et la barre de comparaison 
const compareBar = document.createElement('div');
compareBar.className = 'compare-bar';
compareBar.innerHTML = `<span id="comp-count" style="color:white; font-weight:bold;">0 films</span><button id="btn-compare" style="display:none; padding:8px 16px; background:var(--accent-color); border:none; color:white; border-radius:4px; cursor:pointer;">COMPARER</button>`;
document.body.appendChild(compareBar);


// une fct assynchrone pour charger les films en fonction du mode 
// (populaire, mieux notés, favoris, etc.) et de l'appel API correspondant
// Typage de apiCall pour éviter le 'any' : il doit renvoyer un objet avec un tableau results
async function loadMovies(mode: string, apiCall: () => Promise<{ results: Movie[] }>, reset = true) {
    if (reset) {
        currentMode = mode;
        currentPage = 1;
        mainContent.innerHTML = '<div class="loader"></div>';
        document.querySelectorAll('.nav-links button').forEach(b => b.classList.remove('active'));
        if (mode === 'POPULAR') document.getElementById('nav-popular')?.classList.add('active');
        if (mode === 'TOP_RATED') document.getElementById('nav-toprated')?.classList.add('active');
        
        //On affiche ou on cache le conteneur du bouton
        loadMoreContainer.style.display = mode === 'FAVORITES' ? 'none' : 'flex';
    }

    // on essaye de faire l'appel API et d'afficher les résultats, 
    // sinon on affiche un message d'erreur
    try {
        const data = await apiCall();
        const results = mode === 'FAVORITES' ? favorites : data.results;
        renderGrid(results, getTitle(mode), !reset);
    } catch (e: unknown) { 
        console.error("Erreur API:", e); 
        mainContent.innerHTML = '<p>Erreur de chargement.</p>'; 
    }
}

// une fct pour générer le titre de la page en fonction du mode actuel (populaire, recherche, etc.)
function getTitle(mode: string): string {
    if (mode === 'SEARCH') return `Recherche: "${currentQuery}"`;
    if (mode === 'YEAR') return `Année: ${currentQuery}`;
    if (mode === 'FAVORITES') return 'Mes Favoris ❤️';
    return mode === 'POPULAR' ? 'Films Populaires' : 'Mieux Notés';
}

// une fct pour afficher les films dans une grille, 
// avec des cartes pour chaque film et des boutons d'action (favoris, comparer)
function renderGrid(movies: Movie[], title: string, append: boolean) {
    const statsElem = document.getElementById('stats-counter');
    if (statsElem) statsElem.textContent = `${movies.length} affichés`;
    
    // Si append est false, on remplace le contenu actuel, sinon on ajoute à la liste existante
    if (!append) {
        currentMovies = movies;
        mainContent.innerHTML = `<h2 style="text-align:center">${title}</h2><div class="grid-container"></div>`;
    } else {
        currentMovies = [...currentMovies, ...movies];
    }

    // Si aucun film n'est trouvé, on affiche un message et on cache le bouton "Voir Plus"
    const grid = document.querySelector('.grid-container') as HTMLElement;
    if (movies.length === 0) {
        if (grid) grid.innerHTML = '<p style="text-align:center; grid-column: 1 / -1;">Aucun résultat.</p>';
        loadMoreContainer.style.display = 'none'; // Cache le bouton si plus de résultats
    }

    // Pour chaque film, on crée une carte avec l'affiche, le titre, la note et les boutons d'action
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
        if (grid) grid.appendChild(card);
    });
}

// --- LOGIQUE MÉTIER ---

// une fct pour ajouter ou retirer un film des favoris,
// et mettre à jour le localStorage et l'affichage en conséquence
function toggleFav(m: Movie) {
    const idx = favorites.findIndex(f => f.id === m.id);
    idx === -1 ? favorites.push(m) : favorites.splice(idx, 1);
    localStorage.setItem('myFavorites', JSON.stringify(favorites));
    if (currentMode === 'FAVORITES') {
        loadMovies('FAVORITES', async () => ({ results: favorites }));
    } else {
        renderGrid(currentMovies, getTitle(currentMode), false); 
    }
}

// une fct pour ajouter ou retirer un film de la liste de comparaison,
// avec une limite de 2 films, et mettre à jour la barre de comparaison et le bouton de comparaison 
function toggleComp(m: Movie) {
    const idx = compareList.findIndex(c => c.id === m.id);
    if (idx === -1 && compareList.length < 2) compareList.push(m);
    else if (idx !== -1) compareList.splice(idx, 1);
    else alert("Max 2 films !");
    
    const countElem = document.getElementById('comp-count');
    if (countElem) countElem.textContent = `${compareList.length} films`;
    
    compareBar.classList.toggle('visible', compareList.length > 0);
    const btnCompare = document.getElementById('btn-compare') as HTMLButtonElement;
    if (btnCompare) btnCompare.style.display = compareList.length === 2 ? 'block' : 'none';
}

// une fct pour trier les films affichés en fonction du critère sélectionné (titre A-Z, Z-A, note)
function handleSort() {
    const sort = sortSelect.value;
    const sorted = [...currentMovies];
    if (sort === 'AZ') sorted.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === 'ZA') sorted.sort((a, b) => b.title.localeCompare(a.title));
    if (sort === 'RATING') sorted.sort((a, b) => a.vote_average - b.vote_average);
    
    const grid = document.querySelector('.grid-container') as HTMLElement;
    if (grid) {
        grid.innerHTML = '';
        renderGrid(sorted, getTitle(currentMode), true); 
    }
}

// --- DETAILS & COMPARE VIEWS ---
// une fct pour afficher les détails d'un film sélectionné, avec une grande bannière, 
// les infos principales et un bouton de retour 
async function renderDetail(id: number) {
    loadMoreContainer.style.display = 'none';
    mainContent.innerHTML = '<div class="loader"></div>';
    try {
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
    } catch (e) {
        console.error(e);
        mainContent.innerHTML = '<p>Erreur détails.</p>';
    }
}

// une fct asychrone pour afficher la comparaison entre 2 films sélectionnés, avec une mise en avant 
// du gagnant (meilleure note) et un bouton de retour
async function renderCompare() {
    loadMoreContainer.style.display = 'none'; 
    try {
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
    } catch (e) {
        console.error(e);
        mainContent.innerHTML = '<p>Erreur comparatif.</p>';
    }
}

// --- EVENTS ---
// On lie les boutons de navigation aux fonctions de chargement correspondantes,
// et on gère le bouton de recherche et de filtrage par année
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

const btnCompareAction = document.getElementById('btn-compare');
if (btnCompareAction) btnCompareAction.onclick = renderCompare;

sortSelect.onchange = handleSort;

// GESTION DU BOUTON VOIR PLUS
// En fonction du mode actuel, on appelle l'API correspondante pour charger la page suivante de résultats
loadMoreBtn.onclick = () => {
    currentPage++;
    const originalText = loadMoreBtn.textContent;
    loadMoreBtn.textContent = 'Chargement...';
    
    // Typage explicite du callback apiCall pour TypeScript
    let apiCall: (() => Promise<{ results: Movie[] }>) | undefined;

    if (currentMode === 'POPULAR') apiCall = () => fetchPopularMovies(currentPage);
    else if (currentMode === 'TOP_RATED') apiCall = () => fetchTopRatedMovies(currentPage);
    else if (currentMode === 'SEARCH') apiCall = () => searchMovies(currentQuery, currentPage);
    else if (currentMode === 'YEAR') apiCall = () => fetchMoviesByYear(+currentQuery, currentPage);

    // pour les favoris, on n'a pas de pagination, donc on ne fait rien
    if (apiCall) {
        apiCall().then(data => {
            renderGrid(data.results, getTitle(currentMode), true);
            loadMoreBtn.textContent = originalText;
        }).catch(err => {
            console.error(err);
            loadMoreBtn.textContent = originalText;
        });
    }
};

// Thème & Init
// On gère le thème clair/sombre avec un toggle et on stocke la préférence dans le localStorage
//  pour la retrouver au prochain chargement de la page
document.getElementById('theme-toggle')!.onclick = () => {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
};
if (localStorage.getItem('theme') === 'light') document.body.classList.add('light-mode');

// Lancement
loadMovies('POPULAR', () => fetchPopularMovies(1));
