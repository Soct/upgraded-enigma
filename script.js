const { createApp } = Vue;

document.addEventListener('DOMContentLoaded', () => {

    createApp({
        // ---------- BLOC 1: data (MODIFIÉ) ----------
        data() {
            return {
                loading: true, 
                error: null,
                // MODIFIÉ: renommé 'githubData' en 'allCompetitions'
                allCompetitions: [], 
                
                searchQuery: '',
                hideEnded: true,
                filterHasPrize: false,
                filterIsNew: false, 
                filterIsRecent: false,
                filterIsUpcoming: false,
                sortBy: 'deadline-asc',
                currentPage: 1, 
                itemsPerPage: 10,
                selectedTags: [],
                tagSearchQuery: '',
                
                availableSources: [], 
                selectedSources: []
            };
        },

        // ---------- BLOC 2: computed (MODIFIÉ) ----------
        computed: {
            allTags() {
                const tagsSet = new Set();
                // MODIFIÉ: utilise 'allCompetitions'
                this.allCompetitions.forEach(comp => { 
                    if (comp.tags && Array.isArray(comp.tags)) {
                        comp.tags.forEach(tag => tagsSet.add(tag));
                    }
                });
                return Array.from(tagsSet).sort();
            },

            filteredTags() {
                if (!this.tagSearchQuery) {
                    return this.allTags;
                }
                const query = this.tagSearchQuery.toLowerCase();
                return this.allTags.filter(tag => tag.toLowerCase().includes(query));
            },
            
            sortedAndFilteredCompetitions() {
                
                // MODIFIÉ: utilise 'allCompetitions'
                let list = [...this.allCompetitions];

                // --- Filtres "ET" (cumulatifs) ---

                // Filtre 1: Source
                list = list.filter(comp => this.selectedSources.includes(comp.source));
                
                // Filtre 2: Recherche
                if (this.searchQuery) {
                    const query = this.searchQuery.toLowerCase();
                    list = list.filter(comp => comp.name && comp.name.toLowerCase().includes(query));
                }

                // Filtre 3: Terminés
                if (this.hideEnded) {
                    list = list.filter(comp => !this.isEnded(comp.deadline));
                }

                // Filtre 4: Prix
                if (this.filterHasPrize) {
                    list = list.filter(comp => comp.prize && comp.prize !== "N/A");
                }

                // Filtre 5: Nouveau
                if (this.filterIsNew) {
                    list = list.filter(comp => comp.isNew === true);
                }
                
                // Filtre 6: Récent
                if (this.filterIsRecent) {
                    list = list.filter(comp => this.isRecent(comp.launched));
                }

                // Filtre 7: À venir
                if (this.filterIsUpcoming) {
                    list = list.filter(comp => this.isUpcoming(comp.launched));
                }

                // Filtre 8: Tags
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
                
                list.sort((a, b) => {
                    if (a.isNew && !b.isNew) return -1;
                    if (!a.isNew && b.isNew) return 1;
                    return 0;
                });
                
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
        },
        
        // ---------- BLOC 3: watch ----------
        watch: {
            sortedAndFilteredCompetitions() {
                this.currentPage = 1;
            }
        },

        // ---------- BLOC 4: methods ----------
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
            isRecent(dateString) {
                if (!dateString) return false;
                const now = new Date();
                const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                try {
                    const launchDate = new Date(dateString);
                    return launchDate >= sevenDaysAgo && launchDate <= now;
                } catch (e) {
                    return false;
                }
            },
            isUpcoming(dateString) {
                if (!dateString) return false;
                const now = new Date();
                try {
                    const launchDate = new Date(dateString);
                    return launchDate > now;
                } catch (e) {
                    return false;
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
            }
        },

        // ---------- BLOC 5: mounted (MODIFIÉ) ----------
        async mounted() {
            try {
                const filesToLoad = [
                    './sources/ml_contest.json',
                    './sources/codabench.json',
                    './sources/kaggle.json' // <-- AJOUT DE LA NOUVELLE SOURCE
                ];

                const promises = filesToLoad.map(file => 
                    fetch(file).then(res => {
                        if (!res.ok) {
                            throw new Error(`Le fichier ${file} est manquant. Avez-vous lancé 'node build-data.js' ?`);
                        }
                        return res.json();
                    })
                );
                const allDataArrays = await Promise.all(promises);
                
                const allData = allDataArrays.flat();
                
                // MODIFIÉ: utilise 'allCompetitions'
                this.allCompetitions = allData; 

                const sources = new Set(allData.map(d => d.source));
                this.availableSources = [...sources];
                this.selectedSources = [...sources];

            } catch (err) {
                this.error = err.message;
            } finally {
                this.loading = false;
            }
        }
    }).mount('#app');

});
