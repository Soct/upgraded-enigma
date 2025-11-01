# 🚀 Agrégateur de Compétitions de Machine Learning

Ce projet est une simple application web "front-end" qui agrège les compétitions de Machine Learning (ML) de plusieurs sources en une seule interface unifiée, rapide et filtrable.

Il a été conçu pour résoudre le problème de la dispersion des informations sur plusieurs plateformes, en offrant des outils de recherche, de tri et de filtrage puissants pour trouver des compétitions pertinentes.

---

## Core Features

* **Fusion de Sources :** Affiche les données de "ML Contest" et "Codabench" dans une seule liste.
* **Chargement Asynchrone :** L'application charge d'abord la source la plus rapide (ML Contest) pour une interactivité immédiate, puis charge la source la plus lente (Codabench) en arrière-plan.
* **Chargement Progressif :** Le chargement de Codabench est progressif : les données s'affichent par lots (par 20) au fur et à mesure de leur arrivée, sans bloquer l'interface.
* **Barre de Progression :** Un indicateur de chargement dynamique (`xx / 60`) informe l'utilisateur de l'état du chargement en arrière-plan.
* **Filtrage Puissant :**
    * **Recherche :** Un champ de recherche textuelle sur le nom de la compétition.
    * **Sources :** Cases à cocher pour afficher/masquer "ML Contest" ou "Codabench".
    * **Tags :** Cases à cocher générées dynamiquement pour filtrer par tags (ex: "régression", "NLP").
    * **Prix :** Case à cocher pour n'afficher que les compétitions ayant un prix.
    * **Statut :** Case à cocher (cochée par défaut) pour masquer les compétitions terminées.
* **Tri :** Un menu déroulant pour trier les résultats par date de fin, date de début ou nom.
* **Pagination :** La liste filtrée et triée est découpée en pages de 10 éléments pour une navigation facile.

---

## 🛠️ Stack Technique

* **Framework :** [Vue.js](https://vuejs.org/) (via CDN, sans build system)
* **Langage :** JavaScript (ES6+ Modules)
* **Structure :** HTML5
* **Style :** CSS3 (via un fichier `style.css` séparé)
* **Données (Sources) :**
    * **ML Contest :** Un fichier JSON statique hébergé sur GitHub.
    * **Codabench :** L'API REST publique de Codabench.
* **Proxy CORS :** Un proxy tiers (`api.codetabs.com`) est utilisé pour contourner les restrictions de sécurité (CORS) de l'API Codabench.

---

## 🏃‍♀️ Comment Lancer le Projet

**⚠️ ATTENTION :** Vous ne pouvez pas lancer ce projet en ouvrant directement `index.html` dans votre navigateur (`file:///...`).

Les navigateurs bloqueront les requêtes `fetch()` et les `import` de modules JavaScript pour des raisons de sécurité (CORS).

Vous **devez** utiliser un serveur web local. La méthode la plus simple est :

1.  Ouvrez le dossier du projet dans **Visual Studio Code**.
2.  Installez l'extension [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer).
3.  Faites un clic droit sur le fichier `index.html`.
4.  Choisissez **"Open with Live Server"**.
5.  Votre navigateur s'ouvrira à une adresse comme `http://127.0.0.1:5500`.

---

## 📁 Structure des Fichiers

L'application est divisée en modules logiques pour une meilleure organisation :
```
├── 📁 sources/ 
│    ├── codabench.js (Logique de chargement pour l'API Codabench) 
│    └── mlContest.js (Logique de chargement pour l'API ML Contest) 
│ 
├── index.html (La "coquille" de l'application) 
├── script.js (Le "cerveau" : l'application Vue.js) 
└── style.css (Toute la mise en forme)
```