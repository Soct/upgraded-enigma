# ML Competition List

[![Live Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](https://soct.github.io/upgraded-enigma/)

Une application web "front-end" qui agrège et affiche les compétitions de Machine Learning de sources multiples.

L'application est **générée statiquement** : un script s'exécute (via une GitHub Action) pour récupérer les données des API et les compiler en fichiers JSON statiques. Le "front-end" (Vue.js) ne fait que lire ces fichiers, garantissant un chargement instantané.

---

## 🚀 Fonctionnalités

* **Fusion de Sources :** Affiche "ML Contest" et "Codabench" dans une seule liste.
* **Génération Statique :** Les données sont mises à jour par un script de build, le front-end est 100% statique.
* **Badge "Nouveau" :** Le script de build compare les données et marque les nouvelles entrées (`isNew: true`).
* **Filtrage Puissant :** Recherche par nom, source, tags, statut (terminé/en cours) et par la présence d'un prix.
* **Tri :** Trie les résultats par date de fin (par défaut), date de début ou nom.
* **Pagination :** Affiche les résultats par pages de 10.

---

## 🛠️ Stack Technique

* **Front-End :** [Vue.js 3](https://vuejs.org/) (via CDN)
* **Build :** [Node.js](https://nodejs.org/) (`node-fetch` pour les requêtes API)
* **Automatisation :** [GitHub Actions](https://github.com/features/actions) (pour l'exécution quotidienne du script de build)
* **Hébergement :** [GitHub Pages](https://pages.github.com/)

---

## 🏛️ Architecture

Ce projet est divisé en deux parties :

### 1. Le Script de Build (`build-data.js`)

C'est un script Node.js qui s'exécute côté serveur (via la GitHub Action ou manuellement sur votre PC).

* Il appelle les API externes (ML Contest, Codabench) en utilisant des proxys si nécessaire.
* Il charge les anciens fichiers `.json` du dossier `/sources/` pour les comparer.
* Il génère de nouveaux fichiers (`ml_contest.json`, `codabench.json`) en ajoutant le champ `isNew: true` aux nouvelles entrées.
* Il écrase les anciens fichiers dans `/sources/` avec les nouvelles données.

### 2. L'Application Front-End (`script.js`)

C'est une application Vue.js très légère et rapide.

* Elle **n'appelle aucune API externe**.
* Au chargement, elle fait un `fetch` sur les fichiers locaux (`/sources/ml_contest.json`, etc.).
* Elle fusionne ces listes et gère toute la logique de filtrage, de tri et d'affichage.

---

## 🔄 Workflow de Mise à Jour Automatique

Ce dépôt utilise une **GitHub Action** (définie dans `.github/workflows/update-data.yml`) pour se mettre à jour automatiquement.

1.  **Déclenchement :** L'action s'exécute
    * Automatiquement tous les jours à 5h00 UTC (`schedule`).
    * Manuellement en cliquant sur "Run workflow" dans l'onglet "Actions" du dépôt (`workflow_dispatch`).
2.  **Exécution :** L'action installe Node.js et lance le script `node build-data.js`.
3.  **Commit :** Si le script a modifié des fichiers dans le dossier `sources/` (car de nouvelles données ont été trouvées), l'action **commite et "pushe"** automatiquement ces changements sur le dépôt.
4.  **Déploiement :** GitHub Pages détecte le nouveau commit et met le site en ligne à jour avec les dernières données.

---

## 🏃‍♀️ Comment Contribuer ou Lancer Localement

1.  Clonez le dépôt.
2.  Installez les dépendances du script de build :
    ```bash
    npm install
    ```
3.  Pour mettre à jour les données manuellement (nécessaire pour voir les données Codabench), exécutez le script de build :
    ```bash
    node build-data.js
    ```
4.  Pour voir l'application, lancez un serveur local (via l'extension **Live Server** de VS Code, par exemple) sur `index.html`.