// Fichier: loaders/codabench.js

const fetch = require('node-fetch');

// On place le helper 'fetchWithProxy' ici, car seul Codabench l'utilise.
async function fetchWithProxy(url) {
	const PROXY_URL = `https://api.codetabs.com/v1/proxy?quest=${url}`;
	const response = await fetch(PROXY_URL);
	if (!response.ok) {
		throw new Error(`Erreur HTTP: ${response.status}`);
	}
	return response.json(); 
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
			console.log(`  [Codabench] Chargement page ${currentPage + 1}/${MAX_PAGES_TO_LOAD}...`);
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
		console.error("  [Codabench] Erreur:", err.message);
		return []; 
	}
}

// On exporte la fonction
module.exports = { loadCodabench };
