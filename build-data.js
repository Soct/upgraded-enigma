// Fichier: build-data.js

const fs = require('fs').promises;
const fetch = require('node-fetch');

// --- 1. Logique de chargement des sources (Inchangée) ---

async function loadMLContest() {
    const ML_CONTEST_URL = 'https://raw.githubusercontent.com/mlcontests/mlcontests.github.io/refs/heads/master/competitions.json';
    try {
        const response = await fetch(ML_CONTEST_URL);
        const data = await response.json();
        const processedData = (data.data || []).map(comp => ({
            ...comp, 
            source: 'ML Contest'
        }));
        return processedData;
    } catch (err) {
        console.error("Erreur ML Contest:", err.message);
        return [];
    }
}

async function loadCodabench() {
    const MAX_PAGES_TO_LOAD = 8; 
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

    let allProcessedData = [];
    let nextUrl = 'https://www.codabench.org/api/competitions/public/';
    let currentPage = 0;

    try {
        while (nextUrl && currentPage < MAX_PAGES_TO_LOAD) {
            console.log(`  [Codabench] Chargement page ${currentPage + 1}/${MAX_PAGES_TO_LOAD}...`);
            const listData = await fetchWithProxy(nextUrl);
            
            if (!listData.results) throw new Error("Structure de liste Codabench invalide.");
            
            currentPage++;
            const basicCompetitions = listData.results; 
            
            const detailPromises = basicCompetitions.map(comp => {
                const detailUrl = `https://www.codabench.org/api/competitions/${comp.id}/`;
                return fetchWithProxy(detailUrl);
            });
            const detailResults = await Promise.allSettled(detailPromises);
            
            const successfulDetails = detailResults
                .filter(result => result.status === 'fulfilled')
                .map(result => result.value);

            const processedBatch = successfulDetails.map(comp => {
                let launchedDate = null;
                let deadlineDate = null;
                if (comp.phases && Array.isArray(comp.phases) && comp.phases.length > 0) {
                    launchedDate = comp.phases[0].start; 
                    deadlineDate = comp.phases[comp.phases.length - 1].end;
                }
                return {
                    name: comp.title, url: `https://www.codabench.org/competitions/${comp.id}`,
                    tags: comp.tags || [], launched: launchedDate, deadline: deadlineDate, 
                    prize: comp.reward || "N/A", platform: "Codabench", conference: null,
                    conference_year: null, source: 'Codabench'
                };
            });
            
            const filteredBatch = processedBatch.filter(comp => {
                if (!comp.launched) return true; 
                try { return new Date(comp.launched) >= twelveMonthsAgo; } catch (e) { return false; }
            });
            
            allProcessedData = allProcessedData.concat(filteredBatch);
            nextUrl = listData.next;
        }
        return allProcessedData;
    } catch (err) {
        console.error("  [Codabench] Erreur:", err.message);
        return []; 
    }
}

async function fetchWithProxy(url) {
    const PROXY_URL = `https://api.codetabs.com/v1/proxy?quest=${url}`;
    const response = await fetch(PROXY_URL);
    if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
    }
    return response.json(); 
}

// --- 2. Tâches de génération (MODIFIÉES) ---

// 1. Définir les tâches (sources)
const sourceTasks = [
    {
        name: 'ML Contest',
        loader: loadMLContest,
        // MODIFIÉ: Ajout du chemin 'sources/'
        outputFile: 'sources/ml_contest.json' 
    },
    {
        name: 'Codabench',
        loader: loadCodabench,
        // MODIFIÉ: Ajout du chemin 'sources/'
        outputFile: 'sources/codabench.json' 
    }
];

// 2. Fonction pour traiter une seule source (Inchangée)
async function processSource(task) {
    console.log(`Traitement de la source: ${task.name}...`);

    // 2a. Charger l'ancien fichier (le chemin est déjà correct via task.outputFile)
    let oldUrls = new Set();
    try {
        const oldFile = await fs.readFile(task.outputFile, 'utf8');
        const oldData = JSON.parse(oldFile);
        oldUrls = new Set(oldData.map(comp => comp.url));
        console.log(`  [${task.name}] Ancien fichier chargé (${oldUrls.size} entrées)`);
    } catch (e) {
        console.log(`  [${task.name}] Pas d'ancien fichier.`);
    }

    // 2b. Charger les nouvelles données
    const newData = await task.loader();
    console.log(`  [${task.name}] Nouvelles données chargées (${newData.length} entrées)`);

    // 2c. Comparer et ajouter 'isNew'
    const finalData = newData.map(comp => ({
        ...comp,
        isNew: !oldUrls.has(comp.url)
    }));
    
    // 2d. Écrire le nouveau fichier (le chemin est déjà correct)
    await fs.writeFile(task.outputFile, JSON.stringify(finalData, null, 2));
    console.log(`  [${task.name}] Fichier '${task.outputFile}' écrit avec succès.`);
}

// 3. Fonction principale (Inchangée)
async function buildDataFiles() {
    console.log("Démarrage du build...");
    const allPromises = sourceTasks.map(task => processSource(task));
    await Promise.allSettled(allPromises);
    console.log("Build terminé.");
}

// 4. Lancer le script
buildDataFiles();