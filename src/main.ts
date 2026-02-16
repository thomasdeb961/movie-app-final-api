/*
  IMPORTATIONS ET CONFIGURATION
*/
import { fetchPopularMovies, fetchTopRatedMovies, fetchMovieDetails, searchMovies, fetchMoviesByYear } from './services/api';
import type { Movie } from './types/Movie';
import './style.css';

const mainContent = document.getElementById('main-content') as HTMLElement;
const btnPopular = document.getElementById('nav-popular') as HTMLButtonElement;
const btnTopRated = document.getElementById('nav-toprated') as HTMLButtonElement;
const btnFavorites = document.getElementById('nav-favorites') as HTMLButtonElement;
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const searchBtn = document.getElementById('search-btn') as HTMLButtonElement;
const yearInput = document.getElementById('year-input') as HTMLInputElement;
const yearBtn = document.getElementById('year-btn') as HTMLButtonElement;
const themeToggleBtn = document.getElementById('theme-toggle') as HTMLButtonElement;
const loadMoreContainer = document.getElementById('load-more-container') as HTMLElement;
const loadMoreBtn = document.getElementById('load-more-btn') as HTMLButtonElement;
const sortSelect = document.getElementById('sort-select') as HTMLSelectElement;
const statsCounter = document.getElementById('stats-counter') as HTMLElement;

/*
  ÉTAT DE L'APPLICATION (STATE)
*/
let favorites: Movie[] = JSON.parse(localStorage.getItem('myFavorites') || '[]');
let compareList: Movie[] = [];
let currentMovies: Movie[] = [];
let currentPage = 1;
let currentMode: 'POPULAR' | 'TOP_RATED' | 'SEARCH' | 'YEAR' | 'FAVORITES' = 'POPULAR';
let currentQuery = '';

/*
  INITIALISATION COMPARATEUR
*/
const compareBar = document.createElement('div');
compareBar.className = 'compare-bar';
compareBar.innerHTML = `<span class="compare-info" style="color:white; font-weight:bold;">0 film(s)</span><button id="btn-launch-compare" style="display:none; padding:8px 16px; background:var(--accent-color); border:none; color:white; border-radius:4px; cursor:pointer;">COMPARER</button>`;
document.body.appendChild(compareBar);
const btnLaunchCompare = document.getElementById('btn-launch-compare') as HTMLButtonElement;
const compareInfo = compareBar.querySelector('.compare-info') as HTMLElement;

/*
  FONCTIONS UTILITAIRES
*/
function saveFavorites() {
  localStorage.setItem('myFavorites', JSON.stringify(favorites));
}

function updateStats() {
  statsCounter.textContent = `${currentMovies.length} affichés`;
}

/*
  LOGIQUE DES ACTIONS (Favoris / Comparer)
*/
function toggleFavorite(movie: Movie, event: Event) {
  event.stopPropagation();
  const index = favorites.findIndex(f => f.id === movie.id);
  if (index === -1) favorites.push(movie);
  else favorites.splice(index, 1);
  saveFavorites();
  
  const btn = (event.target as HTMLElement).closest('.action-btn') as HTMLElement;
  if(btn) {
    btn.innerHTML = index === -1 ? '❤️' : '🤍';
    btn.classList.toggle('active');
  }
  if (currentMode === 'FAVORITES') renderFavorites();
}

function toggleCompare(movie: Movie, event: Event) {
  event.stopPropagation();
  const index = compareList.findIndex(m => m.id === movie.id);
  if (index === -1) {
    if (compareList.length >= 2) return alert("Max 2 films !");
    compareList.push(movie);
  } else {
    compareList.splice(index, 1);
  }
  const btn = (event.target as HTMLElement).closest('.action-btn');
  btn?.classList.toggle('active');
  updateCompareUI();
}

function updateCompareUI() {
  compareInfo.textContent = `${compareList.length} film(s) sélectionné(s)`;
  compareBar.classList.toggle('visible', compareList.length > 0);
  btnLaunchCompare.style.display = compareList.length === 2 ? 'block' : 'none';
}

/*
  MOTEUR D'AFFICHAGE (GRILLE)
*/
function handleSort() {
  const criteria = sortSelect.value;
  let sorted = [...currentMovies];
  if (criteria === 'AZ') sorted.sort((a, b) => a.title.localeCompare(b.title));
  else if (criteria === 'ZA') sorted.sort((a, b) => b.title.localeCompare(a.title));
  else if (criteria === 'RATING') sorted.sort((a, b) => a.vote_average - b.vote_average);
  
  // Ici on appelle renderGrid avec isSort=true pour ne pas tout casser, juste vider la grille
  renderGrid(sorted, document.querySelector('h2')?.textContent || '', false, true);
}

function renderGrid(movies: Movie[], titleText: string, append: boolean = false, isSort: boolean = false) {
  loadMoreContainer.style.display = (currentMode === 'FAVORITES' || movies.length === 0) ? 'none' : 'flex';
  
  if (!isSort) {
      if (append) currentMovies = [...currentMovies, ...movies];
      else currentMovies = movies;
  }
  updateStats();

  let grid: HTMLElement;

  if (!append && !isSort) {
    // CAS DU RETOUR INSTANTANÉ : On vide tout et on recrée
    mainContent.innerHTML = '';
    const title = document.createElement('h2');
    title.textContent = titleText;
    title.style.textAlign = 'center';
    mainContent.appendChild(title);
    grid = document.createElement('div');
    grid.className = 'grid-container';
    mainContent.appendChild(grid);
  } else if (!append && isSort) {
     grid = document.querySelector('.grid-container') as HTMLElement;
     if (grid) grid.innerHTML = '';
  } else {
    grid = document.querySelector('.grid-container') as HTMLElement;
  }

  if (movies.length === 0 && !append) mainContent.innerHTML += '<p style="text-align:center">Aucun film trouvé.</p>';

  movies.forEach(movie => {
    const card = document.createElement('article');
    card.className = 'movie-card';
    const isFav = favorites.some(f => f.id === movie.id);
    const isComp = compareList.some(c => c.id === movie.id);
    const imgUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://placehold.co/500x750?text=No+Image';

    card.innerHTML = `
      <div class="card-actions">
        <button class="action-btn fav-btn ${isFav ? 'active' : ''}">${isFav ? '❤️' : '🤍'}</button>
        <button class="action-btn comp-btn ${isComp ? 'active' : ''}">VS</button>
      </div>
      <img src="${imgUrl}" alt="${movie.title}">
      <div class="movie-info"><h3>${movie.title}</h3><span class="rating">⭐ ${movie.vote_average.toFixed(1)}</span></div>
    `;
    card.querySelector('.fav-btn')?.addEventListener('click', (e) => toggleFavorite(movie, e));
    card.querySelector('.comp-btn')?.addEventListener('click', (e) => toggleCompare(movie, e));
    card.addEventListener('click', (e) => {
      if (!(e.target as HTMLElement).closest('.action-btn')) renderMovieDetail(movie.id);
    });
    if (grid) grid.appendChild(card);
  });
}

/*
  PAGES DÉTAILS ET COMPARATIF
*/
async function renderMovieDetail(id: number) {
  loadMoreContainer.style.display = 'none';
  mainContent.innerHTML = '<div class="loader"></div>';
  try {
    const movie = await fetchMovieDetails(id);
    const backdropUrl = movie.poster_path ? `https://image.tmdb.org/t/p/original${movie.poster_path}` : '';
    const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '';
    const genres = movie.genres?.map(g => `<span class="tag">${g.name}</span>`).join('') || '';

    mainContent.innerHTML = `
      <div class="movie-detail">
        <div class="hero-banner" style="background-image: url('${backdropUrl}');"></div>
        <div class="hero-content">
          <div class="poster-wrapper"><img src="${posterUrl}"></div>
          <div class="info-wrapper">
             <h1>${movie.title}</h1>
             <p>⭐ ${movie.vote_average.toFixed(1)} | 📅 ${movie.release_date} | ⏱️ ${movie.runtime} min</p>
             <div class="tags">${genres}</div>
             <p style="line-height:1.6; margin-top:1rem;">${movie.overview}</p>
             <button id="back-btn" style="padding:10px 20px; cursor:pointer; margin-top:20px; background:var(--bg-input); color:var(--text-main); border:none; border-radius:4px;">⬅ Retour</button>
          </div>
        </div>
      </div>
    `;
    
    // BOUTON RETOUR INSTANTANÉ
    document.getElementById('back-btn')?.addEventListener('click', () => {
       // On passe isSort à false et append à false pour forcer la reconstruction immédiate
       renderGrid(currentMovies, getTitleByMode(), false, false); 
       if (currentMode !== 'FAVORITES') loadMoreContainer.style.display = 'flex';
    });
  } catch (e) { mainContent.innerHTML = '<p>Erreur.</p>'; }
}

async function renderComparisonView() {
    loadMoreContainer.style.display = 'none';
    mainContent.innerHTML = '<div class="loader"></div>';
    try {
        const m1 = await fetchMovieDetails(compareList[0].id);
        const m2 = await fetchMovieDetails(compareList[1].id);
        mainContent.innerHTML = `
            <h2 style="text-align:center">Comparatif</h2>
            <div class="compare-container">${createCompareCard(m1, m2)}${createCompareCard(m2, m1)}</div>
            <div style="text-align:center; margin-top:2rem;"><button id="back-comp" style="padding:10px 20px; background:var(--accent-color); color:white; border:none; border-radius:4px; cursor:pointer;">Retour Accueil</button></div>
        `;
        
        // BOUTON RETOUR INSTANTANÉ
        document.getElementById('back-comp')?.addEventListener('click', () => {
            compareList = []; updateCompareUI(); 
            renderGrid(currentMovies, getTitleByMode(), false, false); 
            if (currentMode !== 'FAVORITES') loadMoreContainer.style.display = 'flex';
        });
    } catch (e) { mainContent.innerHTML = '<p>Erreur.</p>'; }
}

function createCompareCard(m: Movie, opp: Movie) {
    const img = m.poster_path ? `https://image.tmdb.org/t/p/w300${m.poster_path}` : '';
    const winNote = m.vote_average > opp.vote_average ? 'winner' : '';
    return `<div class="compare-card"><img src="${img}"><h3>${m.title}</h3>
    <div class="compare-row"><span>Note</span><span class="${winNote}">${m.vote_average.toFixed(1)}</span></div>
    <div class="compare-row"><span>Date</span><span>${m.release_date}</span></div></div>`;
}

function getTitleByMode() {
    if (currentMode === 'POPULAR') return '🔥 Films Populaires';
    if (currentMode === 'TOP_RATED') return '🏆 Mieux Notés';
    if (currentMode === 'SEARCH') return `Résultats: "${currentQuery}"`;
    if (currentMode === 'YEAR') return `Films de ${currentQuery}`;
    return '❤️ Mes Favoris';
}

/*
  CHARGEMENT DONNÉES
*/
async function loadCategory(type: 'POPULAR' | 'TOP_RATED', reset: boolean = true) {
  if (reset) { 
    mainContent.innerHTML = '<div class="loader"></div>';
    currentPage = 1; currentMode = type; updateActiveButton(type === 'POPULAR' ? btnPopular : btnTopRated); sortSelect.value = 'DEFAULT'; 
  }
  const data = type === 'POPULAR' ? await fetchPopularMovies(currentPage) : await fetchTopRatedMovies(currentPage);
  renderGrid(data.results, type === 'POPULAR' ? '🔥 Films Populaires' : '🏆 Mieux Notés', !reset);
}

async function handleSearch(reset: boolean = true) {
  if (reset) { 
    if (!searchInput.value) return; 
    mainContent.innerHTML = '<div class="loader"></div>';
    currentPage = 1; currentMode = 'SEARCH'; currentQuery = searchInput.value; updateActiveButton(null); sortSelect.value = 'DEFAULT'; 
  }
  const data = await searchMovies(currentQuery, currentPage);
  renderGrid(data.results, `Résultats: "${currentQuery}"`, !reset);
}

async function handleYearFilter(reset: boolean = true) {
  if (reset) { 
    if (!yearInput.value) return; 
    mainContent.innerHTML = '<div class="loader"></div>';
    currentPage = 1; currentMode = 'YEAR'; currentQuery = yearInput.value; updateActiveButton(null); sortSelect.value = 'DEFAULT'; 
  }
  const data = await fetchMoviesByYear(parseInt(currentQuery), currentPage);
  renderGrid(data.results, `Films de ${currentQuery}`, !reset);
}

async function handleLoadMore() {
  const originalText = loadMoreBtn.textContent;
  loadMoreBtn.textContent = 'Chargement...'; loadMoreBtn.disabled = true; currentPage++;
  
  if (currentMode === 'POPULAR') await loadCategory('POPULAR', false);
  else if (currentMode === 'TOP_RATED') await loadCategory('TOP_RATED', false);
  else if (currentMode === 'SEARCH') await handleSearch(false);
  else if (currentMode === 'YEAR') await handleYearFilter(false);
  
  loadMoreBtn.textContent = originalText; loadMoreBtn.disabled = false;
}

function renderFavorites() { currentMode = 'FAVORITES'; updateActiveButton(btnFavorites); renderGrid(favorites, '❤️ Mes Favoris'); }

function updateActiveButton(btn: HTMLButtonElement | null) { 
  document.querySelectorAll('.nav-links button').forEach(b => b.classList.remove('active')); 
  if(btn) btn.classList.add('active'); 
}

/*
  EVENTS
*/
btnPopular.onclick = () => loadCategory('POPULAR');
btnTopRated.onclick = () => loadCategory('TOP_RATED');
btnFavorites.onclick = () => renderFavorites();
searchBtn.onclick = () => handleSearch(true);
yearBtn.onclick = () => handleYearFilter(true);
loadMoreBtn.onclick = handleLoadMore;
btnLaunchCompare.onclick = renderComparisonView;
sortSelect.onchange = handleSort;

if (localStorage.getItem('theme') === 'light') document.body.classList.add('light-mode');
themeToggleBtn.onclick = () => {
  document.body.classList.toggle('light-mode');
  localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
};

loadCategory('POPULAR');