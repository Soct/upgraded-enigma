// Fichier: script.js (Le script "Front-End")

const { createApp } = Vue;

document.addEventListener('DOMContentLoaded', () => {

    createApp({
        // ---------- BLOC 1: data ----------
        data() {
            return {
                loading: true, 
                error: null,
                githubData: [],
                searchQuery: '',
                hideEnded: true,
                filterHasPrize: false,
                sortBy: 'deadline-asc',
                currentPage: 1, 
                itemsPerPage: 10,
                selectedTags: [],
                availableSources: [], 
                selectedSources: []
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
            }
        }, // (virgule)

        // ---------- BLOC 5: mounted (MODIFIÉ) ----------
        async mounted() {
            try {
                // MODIFIÉ: Ajout des chemins 'sources/'
                const filesToLoad = [
                    './sources/ml_contest.json',
                    './sources/codabench.json'
                ];

                // 2. On les charge tous en parallèle
                const promises = filesToLoad.map(file => 
                    fetch(file).then(res => {
                        if (!res.ok) {
                            throw new Error(`Le fichier ${file} est manquant. Avez-vous lancé 'node build-data.js' ?`);
                        }
                        return res.json();
                    })
                );
                const allDataArrays = await Promise.all(promises);
                
                // 3. On fusionne les tableaux
                const allData = allDataArrays.flat();
                
                this.githubData = allData; 

                // 4. On génère dynamiquement les filtres de source
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

}); // Fin du DOMContentLoaded