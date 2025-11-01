# 🚀 Agrégateur de Compétitions de Machine Learning

Une application web front-end qui centralise les compétitions de ML de "ML Contest" et "Codabench" en une interface unique, rapide et filtrable.

Ce projet est construit en **JavaScript "vanilla"** (ES6+ Modules) et utilise **Vue.js 3 (via CDN)** pour la réactivité, sans nécessiter de build system.

[![Live Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](https://soct.github.io/upgraded-enigma/)

---

## 🚀 Fonctionnalités

* **Fusion de Sources :** Agrège "ML Contest" et "Codabench".
* **Chargement Asynchrone :** Charge la source rapide en premier, puis la source lente (Codabench) en arrière-plan avec une barre de progression.
* **Filtrage Puissant :** Recherche par nom, source, tags, statut (terminé/en cours) et par la présence d'un prix.
* **Tri :** Trie les résultats par date de fin, date de début ou nom.
* **Pagination :** Affiche les résultats par pages de 10.

---

## 🛠️ Stack Technique

* **Framework :** Vue.js 3 (via CDN)
* **Langage :** JavaScript (ES6+ Modules)
* **Structure :** HTML5 / CSS3
* **APIs :** `fetch`, `Promise.allSettled`
* **Proxy CORS :** Utilisation d'un proxy tiers (`api.codetabs.com`) pour l'API Codabench.

---

## 🏃‍♀️ Lancer Localement

Vous **devez** utiliser un serveur web local (les `import` de modules JS sont bloqués sur `file:///`).

1.  Ouvrez ce dossier dans **VS Code**.
2.  Installez l'extension **Live Server**.
3.  Faites un clic droit sur `index.html` et choisissez **"Open with Live Server"**.

---

## 🔌 Comment Ajouter une Nouvelle Source de Données

L'application est conçue pour être modulaire. Pour ajouter une nouvelle source (par exemple, "MaSuperAPI"), suivez ces étapes :

### 1. Créer un nouveau "Chargeur"

Créez un nouveau fichier dans le dossier `/sources/`, par exemple `maSuperApi.js`.

Ce fichier doit exporter une fonction `async` qui récupère et **formate** les données.


```javascript
// Fichier: /sources/maSuperApi.js

export async function loadMaSuperApi() {
    const API_URL = "https://... l'url de votre api ...";
    
    // Si l'API a des problèmes de CORS, utilisez le proxy
    // const PROXY_URL = `https://api.codetabs.com/v1/proxy?quest=${API_URL}`;
    
    try {
        const response = await fetch(API_URL); // ou PROXY_URL
        const data = await response.json();

        // Étape la plus importante : le "mapping"
        // Transformez les données de l'API en notre format standard
        const processedData = data.items.map(item => ({
            name: item.title,
            url: item.competition_url,
            tags: item.keywords || [],
            launched: item.start_date,
            deadline: item.end_date,
            prize: item.prize_money || "N/A",
            platform: "MaSuperAPI", // Le nom de la plateforme
            conference: null,
            conference_year: null,
            source: "MaSuperAPI" // Le nom du filtre
        }));

        return processedData;

    } catch (err) {
        console.error("Erreur de chargement MaSuperAPI:", err);
        return []; // Toujours renvoyer un tableau vide en cas d'erreur
    }
}
```

### 2. Modifiez *uniquement* `sources/index.js` pour ajouter votre nouvelle source au tableau `allLoaders`.
