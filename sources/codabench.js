// Fichier: sources/codabench.js

// Fonction simple pour utiliser le proxy
async function fetchWithProxy(url) {
    const PROXY_URL = `https://api.codetabs.com/v1/proxy?quest=${url}`;
    
    const response = await fetch(PROXY_URL);
    if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} pour ${url}`);
    }
    return response.json(); 
}

// --- NOUVEAU : On définit une limite ---
// 3 pages = 3 * 20 = 60 compétitions
// Augmentez ce chiffre si vous voulez en charger plus (ex: 5 pour 100)
const MAX_PAGES_TO_LOAD = 3; 

/**
 * Charge les données Codabench de manière progressive.
 * @param {function} onDataBatch - Callback appelée avec chaque lot de données
 * @param {function} onProgressUpdate - Callback appelée avec la progression
 */
export async function loadCodabenchProgressive(onDataBatch, onProgressUpdate) {

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

    let currentItemCount = 0;
    let totalItemsToLoad = 0; // Le total sera (MAX_PAGES * 20)
    let currentPage = 0; // Compteur de pages
    
    let nextUrl = 'https://www.codabench.org/api/competitions/public/';

    try {
        // --- BOUCLE MODIFIÉE ---
        // On s'arrête s'il n'y a plus de page OU si on atteint la limite
        while (nextUrl && currentPage < MAX_PAGES_TO_LOAD) {
            
            const listData = await fetchWithProxy(nextUrl);

            if (!listData.results || !Array.isArray(listData.results)) {
                throw new Error("Structure de liste inattendue.");
            }
            
            // On le fait une seule fois, au début
            if (currentPage === 0) {
                // On calcule le total qu'on *va* charger
                const itemsPerPage = listData.results.length || 20;
                totalItemsToLoad = Math.min(listData.count, MAX_PAGES_TO_LOAD * itemsPerPage);
                // On met à jour la barre de progression (ex: "0 / 60")
                onProgressUpdate(currentItemCount, totalItemsToLoad);
            }
            
            currentPage++; // On incrémente notre compteur de page
            
            const basicCompetitions = listData.results; 

            // (La logique pour charger les détails est inchangée)
            const detailPromises = basicCompetitions.map(comp => {
                const detailUrl = `https://www.codabench.org/api/competitions/${comp.id}/`;
                return fetchWithProxy(detailUrl);
            });
            
            const detailResults = await Promise.allSettled(detailPromises);
            
            const successfulDetails = detailResults
                .filter(result => result.status === 'fulfilled')
                .map(result => result.value);

            // (La logique de mappage est inchangée)
            const processedBatch = successfulDetails.map(comp => {
                let launchedDate = null;
                let deadlineDate = null;
                if (comp.phases && Array.isArray(comp.phases) && comp.phases.length > 0) {
                    launchedDate = comp.phases[0].start; 
                    deadlineDate = comp.phases[comp.phases.length - 1].end;
                }
                return {
                    name: comp.title,
                    url: `https://www.codabench.org/competitions/${comp.id}`,
                    tags: comp.tags || [], 
                    launched: launchedDate, 
                    deadline: deadlineDate, 
                    prize: comp.reward || "N/A", 
                    platform: "Codabench",
                    conference: null,
                    conference_year: null,
                    source: 'Codabench'
                };
            });
            
            // (La logique de filtrage des 12 mois est inchangée)
            const filteredBatch = processedBatch.filter(comp => {
                if (!comp.launched) return true; 
                try {
                    return new Date(comp.launched) >= twelveMonthsAgo;
                } catch (e) {
                    return false;
                }
            });

            // --- ON NOTIFIE L'UI ---
            if (filteredBatch.length > 0) {
                onDataBatch(filteredBatch);
            }
            
            // On met à jour la progression (basée sur le total traité)
            currentItemCount += basicCompetitions.length;
            onProgressUpdate(currentItemCount, totalItemsToLoad);
            
            // On passe à la page de liste suivante
            nextUrl = listData.next;
        }
        
    } catch (err) {
        console.error("Erreur de chargement Codabench (progressif):", err);
        throw err;
    }
}