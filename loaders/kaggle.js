// Fichier: loaders/kaggle.js
// MODIFIÉ: Implémentation d'une boucle de pagination pour tout récupérer

const fetch = require('node-fetch');
const { Buffer } = require('buffer'); // Module natif de Node.js pour l'encodage Base64

/**
 * Formatte l'objet de l'API JSON de Kaggle pour notre app
 * @param {object} comp - Compétition brute de l'API
 * @returns {object}
 */
function formatKaggleCompetition(comp) {
    // L'API JSON retourne directement un objet "reward"
    // (ex: "$100,000", "Knowledge", "Swag")
    const prize = comp.reward || "N/A";

    // L'API JSON retourne un tableau d'objets 'tags'
    const tags = (comp.tags || []).map(tag => tag.name);

    return {
        name: comp.title,
        url: comp.url, // L'API JSON fournit déjà l'URL complète
        tags: tags,
        launched: comp.enabledDate,
        deadline: comp.deadline,
        prize: prize,
        platform: "Kaggle",
        conference: null,
        conference_year: null,
        source: 'Kaggle'
    };
}


async function loadKaggle() {
    console.log("  [Kaggle] Chargement via l'API Node.js (fetch)...");

    // 1. Vérifier que les secrets sont présents
    const username = process.env.KAGGLE_USERNAME;
    const key = process.env.KAGGLE_KEY;

    if (!username || !key) {
        console.error("  [Kaggle] Erreur: KAGGLE_USERNAME ou KAGGLE_KEY non défini.");
        console.error("  [Kaggle] Veuillez définir ces variables d'environnement.");
        return [];
    }

    // 2. Préparer l'authentification "Basic Auth"
    const auth = 'Basic ' + Buffer.from(username + ':' + key).toString('base64');

    // 3. Implémenter la boucle de pagination
    let allCompetitions = [];
    let currentPage = 1;
    const MAX_PAGES = 10; // Sécurité pour éviter une boucle infinie
    const RESULTS_PER_PAGE = 20; // L'API semble renvoyer 20 par défaut

    console.log("  [Kaggle] Démarrage de la pagination...");

    try {
        while (currentPage <= MAX_PAGES) {
            // Définir l'URL de l'API avec le numéro de page
            // Note: Nous enlevons 'page_size' car il est ignoré, et nous utilisons 'page'
            const apiUrl = `https://www.kaggle.com/api/v1/competitions/list?group=general&sortBy=latestDeadline&page=${currentPage}`;
            
            console.log(`  [Kaggle] Chargement de la page ${currentPage}...`);

            // 4. Exécuter la requête
            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': auth
                }
            });

            if (!response.ok) {
                // Si la page 1 échoue, c'est une erreur. Si une page > 1 échoue, c'est peut-être juste la fin.
                if (currentPage === 1) {
                    throw new Error(`Erreur API Kaggle: ${response.status} ${response.statusText}`);
                } else {
                    console.log(`  [Kaggle] Page ${currentPage} non trouvée, arrêt de la pagination.`);
                    break; // Sortir de la boucle si une page > 1 renvoie une erreur (ex: 404)
                }
            }

            const competitionsBatch = await response.json();

            // 5. Parser la réponse
            if (!Array.isArray(competitionsBatch)) {
                console.error("  [Kaggle] La réponse de l'API n'est pas un tableau.");
                break; // Problème avec la réponse, on arrête
            }

            // 6. Ajouter les résultats au tableau principal
            allCompetitions = allCompetitions.concat(competitionsBatch);

            // 7. Condition d'arrêt
            // Si l'API renvoie MOINS de 20 résultats, c'est la dernière page.
            if (competitionsBatch.length < RESULTS_PER_PAGE) {
                console.log(`  [Kaggle] Dernière page atteinte (${competitionsBatch.length} résultats).`);
                break;
            }
            
            // Si le lot est vide (double sécurité)
            if (competitionsBatch.length === 0) {
                 console.log("  [Kaggle] Page vide, arrêt.");
                 break;
            }

            // Passer à la page suivante
            currentPage++;
        }

        if (currentPage > MAX_PAGES) {
            console.warn(`  [Kaggle] Limite de ${MAX_PAGES} pages atteinte.`);
        }
        
        console.log(`  [Kaggle] Total de ${allCompetitions.length} compétitions chargées.`);
        return allCompetitions.map(formatKaggleCompetition);

    } catch (err) {
         console.error("  [Kaggle] Erreur:", err.message);
         return [];
    }
}

// On exporte la fonction pour que build-data.js puisse l'importer
module.exports = { loadKaggle };

