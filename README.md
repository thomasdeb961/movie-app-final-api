#  MovieApp Ultimate

Application web de découverte de films, développée en **TypeScript Vanilla** (sans framework) avec l'API TMDB.
Ce projet a été réalisé pour démontrer la maîtrise du DOM, des appels API asynchrones et de la gestion d'état côté client.

🔗 Voir la démo en ligne([https://movie-app-final-api.vercel.app](https://movie-app-final-api.vercel.app/)
##  Fonctionnalités

###  Navigation & Recherche
* **Catalogue** : Affichage des films "Populaires" et "Mieux notés".
* **Recherche** : Barre de recherche connectée à l'API TMDB.
* **Filtres** : Filtrage par année de sortie.
* **Tri Dynamique** : Tri des résultats affichés (A-Z, Z-A, Note) sans rechargement.
* **Pagination** : Bouton "Voir plus" pour charger les films suivants.

###  Fonctionnalités Avancées
* **Comparateur de Films** : Outil permettant de sélectionner 2 films et de les comparer côte à côte (Notes, Dates, Durées) avec mise en évidence du vainqueur.
* **Favoris** : Système de likes  avec persistance des données (LocalStorage).
* **Détails Enrichis** : Fiche détaillée avec synopsis, genres, casting, et bouton de retour intelligent.

###  Interface Utilisateur (UI/UX)
* **Design Responsive** : Grille adaptative (Mobile / Tablette / Desktop).
* **Thème** : Mode Sombre / Mode Clair (Dark Mode) avec sauvegarde du choix utilisateur.
* **Feedback** : Animations de chargement (Spinner CSS) et transitions fluides.
* **Stats** : Compteur de films affichés en temps réel.

##  Stack Technique

* **Langage** : TypeScript (Strict Mode)
* **Build Tool** : Vite
* **Style** : CSS3 Natif (Variables CSS, Flexbox, Grid)
* **API** : [The Movie Database (TMDB)](https://www.themoviedb.org/documentation/api)
* **Hébergement** : Vercel

##  Installation et Lancement

1.  **Cloner le projet**
    ```bash
    git clone [https://github.com/TON_PSEUDO/movie-app-final.git](https://github.com/TON_PSEUDO/movie-app-final.git)
    cd movie-app-final
    ```

2.  **Installer les dépendances**
    ```bash
    npm install
    ```

3.  **Configurer l'API**
    * Ouvrez le fichier `src/services/api.ts`.
    * Remplacez la variable `API_KEY` par votre propre clé API TMDB.

4.  **Lancer le serveur de développement**
    ```bash
    npm run dev
    ```
    L'application sera accessible sur `http://localhost:5173`.

5.  **Compiler pour la production**
    ```bash
    npm run build
    ```

##  Structure du Projet

```text
/src
 ├── /services       # Appels API (fetch, gestion des erreurs)
 ├── /types          # Interfaces TypeScript (Typage des données films)
 ├── main.ts         # Logique principale (DOM, State, Events, Comparateur)
 ├── style.css       # Styles globaux, responsive et animations
index.html           # Structure HTML de base
