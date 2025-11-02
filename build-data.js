require('dotenv').config();
// Fichier: build-data.js (L'orchestrateur principal)

const fs = require('fs').promises;

// --- 1. Importer les loaders depuis leur dossier ---
const { loadKaggle } = require('./loaders/kaggle.js');
const { loadMLContest } = require('./loaders/mlcontest.js');
const { loadCodabench } = require('./loaders/codabench.js');

// --- 2. Tâches de génération ---

// 1. Définir les tâches (sources)
const sourceTasks = [
	{
		name: 'ML Contest', // Contient tout SAUF Kaggle
		loader: loadMLContest,
		outputFile: 'sources/ml_contest.json' 
	},
	{
		name: 'Codabench',
		loader: loadCodabench,
		outputFile: 'sources/codabench.json' 
	},
    // --- AJOUT DE KAGGLE ---
	{
		name: 'Kaggle',
		loader: loadKaggle,
		outputFile: 'sources/kaggle.json' 
	}
    // --- FIN DE L'AJOUT ---
];

// 2. Fonction pour traiter une seule source (Inchangée)
async function processSource(task) {
	console.log(`Traitement de la source: ${task.name}...`);

	// 2a. Charger l'ancien fichier
	let oldUrls = new Set();
	try {
		const oldFile = await fs.readFile(task.outputFile, 'utf8');
		const oldData = JSON.parse(oldFile);
		oldUrls = new Set(oldData.map(comp => comp.url));
		console.log(`  [${task.name}] Ancien fichier chargé (${oldUrls.size} entrées)`);
	} catch (e) {
		// C'est normal si le fichier n'existe pas encore
		console.log(`  [${task.name}] Pas d'ancien fichier.`);
	}

	// 2b. Charger les nouvelles données
	const newData = await task.loader();
	console.log(`  [${task.name}] Nouvelles données chargées (${newData.length} entrées)`);

	// 2c. Comparer et ajouter 'isNew'
	const finalData = newData.map(comp => ({
		...comp,
		isNew: !oldUrls.has(comp.url)
	}));
	
	// 2d. Écrire le nouveau fichier
	await fs.writeFile(task.outputFile, JSON.stringify(finalData, null, 2));
	console.log(`  [${task.name}] Fichier '${task.outputFile}' écrit avec succès.`);
}

// 3. Fonction principale (Inchangée)
async function buildDataFiles() {
	console.log("Démarrage du build...");

    // S'assurer que le dossier 'sources/' existe
    try {
        await fs.mkdir('sources', { recursive: true });
    } catch (e) {
        console.error("Erreur lors de la création du dossier 'sources':", e);
        return; // Arrêter si on ne peut pas créer le dossier
    }

	const allPromises = sourceTasks.map(task => processSource(task));
	await Promise.allSettled(allPromises);
	console.log("Build terminé.");
}

// 4. Lancer le script
buildDataFiles();

