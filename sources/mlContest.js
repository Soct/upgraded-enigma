// Fichier: sources/mlContest.js

// On "exporte" cette fonction pour que script.js puisse l'importer
export async function loadMLContest() {
    
    const ML_CONTEST_URL = 'https://raw.githubusercontent.com/mlcontests/mlcontests.github.io/refs/heads/master/competitions.json';
    
    try {
        const response = await fetch(ML_CONTEST_URL);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        // On "marque" les données comme on l'a fait avant
        const processedData = (data.data || []).map(comp => {
            return {
                ...comp, 
                source: 'ML Contest' // On marque la source
            };
        });
        
        return processedData; // On renvoie la liste
        
    } catch (err) {
        console.error("Erreur de chargement ML Contest:", err);
        return []; // En cas d'erreur, on renvoie un tableau vide
    }
}