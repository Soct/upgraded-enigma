// Fichier: script.js

const { createApp } = Vue;
import { loadMLContest } from './sources/mlContest.js';
import { loadCodabenchProgressive } from './sources/codabench.js';

createApp({
    // ---------- BLOC 1: data ----------
    data() {
        return {
            loading: true, 
            codabenchLoading: false, 
            codabenchProgressCurrent: 0,
            codabenchProgressTotal: 0, 
            error: null,
            githubData: [], 
            searchQuery: '',
            hideEnded: true,
            
            // NOUVELLE VARIABLE
            filterHasPrize: false, // Par défaut, on n'active pas ce filtre
            
            sortBy: 'deadline-asc',
            currentPage: 1, 
            itemsPerPage: 10,
            selectedTags: [],
            availableSources: ['ML Contest', 'Codabench'], 
            selectedSources: ['ML Contest', 'Codabench']
        };
    }, // (virgule)

    // ---------- BLOC 2: computed ----------
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

        // COMPUTED MISE À JOUR
        sortedAndFilteredCompetitions() {
            let list = [...this.githubData];

            // --- Filtres ---
            list = list.filter(comp => this.selectedSources.includes(comp.source));

            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                list = list.filter(comp => comp.name && comp.name.toLowerCase().includes(query));
            }

            if (this.hideEnded) {
                list = list.filter(comp => !this.isEnded(comp.deadline));
            }
            
            // --- NOUVEAU BLOC DE FILTRE ---
            if (this.filterHasPrize) {
                // On ne garde que les comp. qui ont un 'prize' 
                // (ni null, ni undefined, ni "N/A")
                list = list.filter(comp => 
                    comp.prize && comp.prize !== "N/A"
                );
            }
            // --- FIN NOUVEAU BLOC ---

            if (this.selectedTags.length > 0) {
                list = list.filter(comp => {
                    if (comp.tags && Array.isArray(comp.tags)) {
                        return this.selectedTags.every(tag => comp.tags.includes(tag));
                    }
                    return false; 
                });
            }
            
            // --- Tri (inchangé) ---
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
        }
    }, // (virgule)
    
    // ---------- BLOC 3: watch ----------
    watch: {
        sortedAndFilteredCompetitions() {
            this.currentPage = 1;
        }
    }, // (virgule)

    // ---------- BLOC 4: methods ----------
    methods: {
        // (Toutes les méthodes sont complètes et inchangées)
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
        async loadSlowData() {
            this.codabenchLoading = true;
            this.codabenchProgressTotal = 0; 
            
            const onDataBatch = (batch) => {
                this.githubData.push(...batch);
            };
            
            const onProgressUpdate = (current, total) => {
                this.codabenchProgressCurrent = current;
                this.codabenchProgressTotal = total;
            };

            try {
                // On utilise la fonction progressive
                await loadCodabenchProgressive(onDataBatch, onProgressUpdate); 
            } catch (err) {
                console.error("Erreur de chargement Codabench (progressif):", err);
                this.error = "Erreur de chargement Codabench. (Voir console)";
            } finally {
                this.codabenchLoading = false;
            }
        }
    }, // (virgule)

    // ---------- BLOC 5: mounted ----------
    async mounted() {
        try {
            const mlContestData = await loadMLContest();
            this.githubData = this.githubData.concat(mlContestData); 
        } catch (err) {
            this.error = "Erreur critique lors du chargement des données initiales.";
            console.error("Erreur dans mounted (ML Contest):", err);
        } finally {
            this.loading = false;
            this.loadSlowData();
        }
    }

}).mount('#app');