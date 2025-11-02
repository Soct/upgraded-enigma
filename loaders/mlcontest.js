// Fichier: loaders/mlcontest.js

const fetch = require('node-fetch');

async function loadMLContest() {
    const ML_CONTEST_URL = 'https://raw.githubusercontent.com/mlcontests/mlcontests.github.io/refs/heads/master/competitions.json';
    try {
        console.log("  [ML Contest] Chargement du JSON...");
        const response = await fetch(ML_CONTEST_URL);
        const data = await response.json();
        
        // Traitement initial
        const processedData = (data.data || []).map(comp => ({
            ...comp, 
            source: comp.platform || 'ML Contest' // Utilise 'platform' comme source
        }));

        // On exclut Kaggle car il a son propre loader
        const mlContestData = processedData.filter(comp => comp.platform !== 'Kaggle');
        
        // Renomme la source pour être propre
        return mlContestData.map(comp => ({ ...comp, source: 'ML Contest' }));

    } catch (err) {
         console.error("  [ML Contest] Erreur:", err.message);
         return [];
    }
}

// On exporte la fonction
module.exports = { loadMLContest };
