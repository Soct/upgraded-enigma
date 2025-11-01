// Fichier: script.js

const { createApp } = Vue;
// NOUVEL IMPORT : On importe SEULEMENT le fichier baril
import { allLoaders } from './sources/index.js';

createApp({
    // ---------- BLOC 1: data ----------
    data() {
        return {
            loading: true, 
            slowLoaders: {
                // Sera rempli dynamiquement, ex: Codabench: { ... }
            },
            error: null,
            githubData: [], 
            searchQuery: '',
            hideEnded: true,
            filterHasPrize: false,
            sortBy: 'deadline-asc',
            currentPage: 1, 
            itemsPerPage: 10,
            selectedTags: [],
            
            // Données générées automatiquement !
            availableSources: allLoaders.map(loader => loader.name), 
            selectedSources: allLoaders.map(loader => loader.name)
        };
    }, // (virgule)

    // ---------- BLOC 2: computed (COMPLET) ----------
    computed: {
        allTags() {
            const tagsSet = new Set();
            this.githubData.forEach(comp => {
                if (comp.tags && Array.isArray(comp.tags)) {
                    comp.tags.forEach(tag => tagsSet.add(tag));
                }
            });
            return Array.from(tagsSet).sort();
        },

        sortedAndFilteredCompetitions() {
            let list = [...this.githubData];
            list = list.filter(comp => this.selectedSources.includes(comp.source));
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                list = list.filter(comp => comp.name && comp.name.toLowerCase().includes(query));
            }
            if (this.hideEnded) {
                list = list.filter(comp => !this.isEnded(comp.deadline));
            }
            if (this.filterHasPrize) {
                list = list.filter(comp => comp.prize && comp.prize !== "N/A");
            }
            if (this.selectedTags.length > 0) {
                list = list.filter(comp => {
                    if (comp.tags && Array.isArray(comp.tags)) {
                        return this.selectedTags.every(tag => comp.tags.includes(tag));
                    }
                    return false; 
                });
            }
            const parseDate = (dateString) => {
                if (!dateString) return new Date('2100-01-01');
                try { return new Date(dateString); } catch (e) { return new Date('2100-01-01'); }
            };
            if (this.sortBy === 'name-asc') {
                list.sort((a, b) => a.name.localeCompare(b.name));
            } 
            else if (this.sortBy === 'deadline-asc') {
                list.sort((a, b) => parseDate(a.deadline) - parseDate(b.deadline));
            } 
            else if (this.sortBy === 'launched-desc') {
                list.sort((a, b) => parseDate(b.launched) - parseDate(a.launched));
            }
            return list;
        },
        
        totalPages() {
            return Math.ceil(this.sortedAndFilteredCompetitions.length / this.itemsPerPage);
        },
        
        paginatedCompetitions() {
            const startIndex = (this.currentPage - 1) * this.itemsPerPage;
            const endIndex = startIndex + this.itemsPerPage;
            return this.sortedAndFilteredCompetitions.slice(startIndex, endIndex);
        },

        activeSlowLoaders() {
            const active = {};
            for (const loaderName in this.slowLoaders) {
                if (this.slowLoaders[loaderName].loading) {
                    active[loaderName] = this.slowLoaders[loaderName];
                }
            }
            return active;
        }
    }, // (virgule)
    
    // ---------- BLOC 3: watch (COMPLET) ----------
    watch: {
        sortedAndFilteredCompetitions() {
            this.currentPage = 1;
        }
    }, // (virgule)

    // ---------- BLOC 4: methods (COMPLET) ----------
    methods: {
        calculateRemainingTime(dateString) {
            if (!dateString) return "Date de fin non spécifiée"; 
            try {
                const deadlineDate = new Date(dateString);
                const now = new Date();
                const diffTime = deadlineDate - now;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays <= 0) return "Terminé";
                if (diffDays === 1) return "Dernier jour !";
                return `${diffDays} jours restants`;
            } catch (e) { return "Date invalide"; }
        },
        isEnded(dateString) {
            if (!dateString) return false; 
            try {
                return new Date(dateString) < new Date(); 
            } catch (e) { return false; }
        },
        formatDisplayDate(dateString) {
            if (!dateString) return "N/A"; 
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                });
            } catch (e) {
                return dateString;
            }
        },
        nextPage() {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
            }
        },
        prevPage() {
            if (this.currentPage > 1) {
                this.currentPage--;
            }
        },
        
        async loadSlowData(loader) {
            const loaderName = loader.name;
            
            this.slowLoaders[loaderName] = {
                loading: true,
                current: 0,
                total: 0
            };
            
            const onDataBatch = (batch) => {
                this.githubData.push(...batch);
            };
            
            const onProgressUpdate = (current, total) => {
                this.slowLoaders[loaderName].current = current;
                this.slowLoaders[loaderName].total = total;
            };

            try {
                await loader.load(onDataBatch, onProgressUpdate);
            } catch (err) {
                console.error(`Erreur de chargement ${loaderName} (progressif):`, err);
                this.error = `Erreur de chargement ${loaderName}. (Voir console)`;
            } finally {
                this.slowLoaders[loaderName].loading = false;
            }
        }
    }, // (virgule)

    // ---------- BLOC 5: mounted (CORRIGÉ) ----------
    async mounted() {
        
        // --- C'EST LA CORRECTION ---
        // 1. On DÉCLARE les listes ici (portée 'mounted')
        let simpleLoaders = [];
        let progressiveLoaders = [];
        // --- FIN CORRECTION ---

        try {
            // 2. On ASSIGNE les listes ici (portée 'try')
            simpleLoaders = allLoaders.filter(l => l.type === 'simple');
            progressiveLoaders = allLoaders.filter(l => l.type === 'progressive');

            const simplePromises = simpleLoaders.map(loader => loader.load());
            const settledResults = await Promise.allSettled(simplePromises);
            
            settledResults.forEach(result => {
                if (result.status === 'fulfilled') {
                    this.githubData = this.githubData.concat(result.value);
                } else {
                    console.error("Un chargeur simple a échoué:", result.reason);
                }
            });

        } catch (err) {
            this.error = "Erreur critique lors du chargement des données initiales.";
            console.error("Erreur dans mounted:", err);
        } finally {
            // 3. On COUPE le spinner principal
            this.loading = false;
            
            // 4. On LANCE les chargeurs lents (maintenant accessible)
            progressiveLoaders.forEach(loader => {
                this.loadSlowData(loader);
            });
        }
    }

}).mount('#app');