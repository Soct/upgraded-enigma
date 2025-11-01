// Fichier: /sources/index.js

// 1. Importer toutes les fonctions de chargement
import { loadMLContest } from './mlContest.js';
import { loadCodabenchProgressive } from './codabench.js';
// (Si vous ajoutez kaggle.js, importez-le ici)
// import { loadKaggle } from './kaggle.js';

// 2. Exporter un tableau d'objets "chargeur"
// C'est le seul endroit que vous aurez à modifier à l'avenir.
export const allLoaders = [
    {
        name: "ML Contest",
        // "simple" = rapide, renvoie une promesse
        type: "simple", 
        load: loadMLContest 
    },
    {
        name: "Codabench",
        // "progressive" = lent, utilise des callbacks
        type: "progressive", 
        load: loadCodabenchProgressive
    }
    // (Si vous ajoutez Kaggle)
    // {
    //     name: "Kaggle",
    //     type: "simple",
    //     load: loadKaggle
    // }
];