// ============================================
// CONFIGURATION
// ============================================
const API_BASE_URL = 'http://localhost:8081/api';
const OMDB_API_KEY = '565370ed';
const OMDB_BASE_URL = 'http://www.omdbapi.com/';
const MAX_RESULTS = 50; // Target number of results
const RESULTS_PER_PAGE = 10; // OMDB returns 10 results per page

// ============================================
// STATE MANAGEMENT
// ============================================
let currentUserId = null;
let currentUsername = null;
let selectedMovie = null;
let currentRating = 0;
let editingReviewId = null;
let searchTimeout = null;
let carouselMovies = [];
let currentFilters = {
    year: '',
    type: '',
    search: ''
};

// ============================================
// INITIALIZATION
// ============================================
window.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    currentUserId = localStorage.getItem('userId');
    currentUsername = localStorage.getItem('username');

    if (!currentUserId) {
        window.location.href = 'index.html';
        return;
    }

    // Set username display
    document.getElementById('usernameDisplay').textContent = `👋 ${currentUsername}`;
    
    // Initialize year filter
    populateYearFilter();
    
    // Load user reviews
    loadUserReviews();

    // Add character counter listener
    const reviewTextArea = document.getElementById('reviewText');
    reviewTextArea.addEventListener('input', updateCharCount);
});

// ============================================
// YEAR FILTER POPULATION
// ============================================
function populateYearFilter() {
    const yearSelect = document.getElementById('yearFilter');
    const currentYear = new Date().getFullYear();
    
    // Add years from current year back to 1900
    for (let year = currentYear; year >= 1900; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================
// REVIEW LOADING & DISPLAY
// ============================================
async function loadUserReviews() {
    const container = document.getElementById('reviewsContainer');
    const emptyState = document.getElementById('emptyState');

    try {
        const response = await fetch(`${API_BASE_URL}/reviews/user/${currentUserId}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch reviews');
        }
        
        const reviews = await response.json();

        container.innerHTML = '';

        if (reviews.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            document.getElementById('reviewCount').textContent = 'No reviews yet';
            return;
        }

        container.style.display = 'grid';
        emptyState.style.display = 'none';
        document.getElementById('reviewCount').textContent =
            `${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'}`;

        reviews.forEach(review => {
            container.appendChild(createReviewCard(review));
        });
    } catch (error) {
        console.error('Error loading reviews:', error);
        showToast('Failed to load reviews. Please try again.', 'error');
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">Failed to load reviews</p>';
    }
}

function createReviewCard(review) {
    const card = document.createElement('div');
    card.className = 'review-card';

    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    const date = new Date(review.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const posterUrl = review.moviePoster && review.moviePoster !== 'N/A' 
        ? review.moviePoster 
        : 'https://via.placeholder.com/300x450?text=No+Poster';

    card.innerHTML = `
        <img src="${posterUrl}" 
             alt="${escapeHtml(review.movieTitle)} Poster"
             class="review-card-poster"
             onerror="this.src='https://via.placeholder.com/300x450?text=No+Poster'">
        <div class="review-card-content">
            <h3 class="review-card-title">${escapeHtml(review.movieTitle)}</h3>
            <p class="review-card-director">Directed by ${escapeHtml(review.director || 'Unknown')}</p>
            <div class="review-card-rating">${stars}</div>
            <p class="review-card-text">${escapeHtml(review.reviewText)}</p>
            <p class="review-card-date">Reviewed on ${date}</p>
            <div class="review-card-actions">
                <button class="btn btn-edit" onclick="openEditModal(${review.id})">Edit</button>
                <button class="btn btn-delete" onclick="deleteReview(${review.id})">Delete</button>
            </div>
        </div>
    `;
    
    return card;
}

// ============================================
// FILTER MANAGEMENT
// ============================================
function handleFilterChange() {
    const yearFilter = document.getElementById('yearFilter');
    const typeFilter = document.getElementById('typeFilter');
    
    currentFilters.year = yearFilter.value;
    currentFilters.type = typeFilter.value;
    
    updateActiveFiltersDisplay();
}

function updateActiveFiltersDisplay() {
    const activeFiltersDiv = document.getElementById('activeFilters');
    const filterTagsDiv = document.getElementById('filterTags');
    
    const hasFilters = currentFilters.year || currentFilters.type;
    
    if (hasFilters) {
        activeFiltersDiv.style.display = 'flex';
        filterTagsDiv.innerHTML = '';
        
        if (currentFilters.year) {
            filterTagsDiv.appendChild(createFilterTag('Year', currentFilters.year, 'year'));
        }
        
        if (currentFilters.type) {
            const typeLabels = {
                'movie': 'Movie',
                'series': 'TV Series'
            };
            filterTagsDiv.appendChild(createFilterTag('Type', typeLabels[currentFilters.type], 'type'));
        }
    } else {
        activeFiltersDiv.style.display = 'none';
    }
}

function createFilterTag(label, value, filterKey) {
    const tag = document.createElement('div');
    tag.className = 'filter-tag';
    tag.innerHTML = `
        <span>${label}: ${value}</span>
        <span class="filter-tag-close" onclick="removeFilter('${filterKey}')">&times;</span>
    `;
    return tag;
}

function removeFilter(filterKey) {
    if (filterKey === 'year') {
        document.getElementById('yearFilter').value = '';
        currentFilters.year = '';
    } else if (filterKey === 'type') {
        document.getElementById('typeFilter').value = '';
        currentFilters.type = '';
    }
    
    updateActiveFiltersDisplay();
}

function clearAllFilters() {
    document.getElementById('yearFilter').value = '';
    document.getElementById('typeFilter').value = '';
    document.getElementById('movieSearch').value = '';
    currentFilters.year = '';
    currentFilters.type = '';
    currentFilters.search = '';
    
    updateActiveFiltersDisplay();
    hideCarousel();
    updateSearchStatus('');
}

// ============================================
// SEARCH INPUT HANDLING
// ============================================
function handleSearchInput() {
    const query = document.getElementById('movieSearch').value.trim();
    currentFilters.search = query;
    
    clearTimeout(searchTimeout);
    
    if (query.length < 2) {
        updateSearchStatus('');
        return;
    }
    
    updateSearchStatus('Type at least 2 characters and click "Show Results"', 'info');
}

function updateSearchStatus(message, type = '') {
    const statusDiv = document.getElementById('searchStatus');
    statusDiv.textContent = message;
    statusDiv.className = `search-status ${type}`;
}

// ============================================
// APPLY FILTERS & LOAD CAROUSEL (MULTI-PAGE)
// ============================================
async function applyFilters() {
    const searchQuery = document.getElementById('movieSearch').value.trim();
    const yearFilter = currentFilters.year;
    const typeFilter = currentFilters.type;
    
    // Must have either search query or filters
    if (!searchQuery && !yearFilter && !typeFilter) {
        showToast('Please enter a search term or select filters', 'warning');
        return;
    }
    
    // If only filters without search, need a generic search
    const query = searchQuery || 'movie'; // Default search term if only filters
    
    // Show loading state
    showCarouselLoading();
    updateSearchStatus('🔍 Searching for movies...', 'searching');
    
    try {
        // Calculate how many pages we need to fetch (5 pages = 50 results)
        const pagesToFetch = Math.ceil(MAX_RESULTS / RESULTS_PER_PAGE);
        
        // Build base API URL
        let baseUrl = `${OMDB_BASE_URL}?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(query)}`;
        
        if (yearFilter) {
            baseUrl += `&y=${yearFilter}`;
        }
        
        if (typeFilter) {
            baseUrl += `&type=${typeFilter}`;
        }
        
        // Fetch multiple pages concurrently
        const pagePromises = [];
        for (let page = 1; page <= pagesToFetch; page++) {
            pagePromises.push(
                fetch(`${baseUrl}&page=${page}`)
                    .then(res => res.json())
                    .catch(err => {
                        console.error(`Error fetching page ${page}:`, err);
                        return { Response: 'False' };
                    })
            );
        }
        
        // Wait for all pages to complete
        const allResponses = await Promise.all(pagePromises);
        
        // Combine results from all pages
        let allMovies = [];
        let totalResults = 0;
        
        for (const data of allResponses) {
            if (data.Response === 'True' && data.Search && data.Search.length > 0) {
                allMovies = allMovies.concat(data.Search);
                // Get total results count from first successful response
                if (totalResults === 0 && data.totalResults) {
                    totalResults = parseInt(data.totalResults);
                }
            }
        }
        
        // Remove duplicates based on imdbID (just in case)
        const uniqueMovies = [];
        const seenIds = new Set();
        
        for (const movie of allMovies) {
            if (!seenIds.has(movie.imdbID)) {
                seenIds.add(movie.imdbID);
                uniqueMovies.push(movie);
            }
        }
        
        if (uniqueMovies.length > 0) {
            carouselMovies = uniqueMovies;
            displayCarousel(carouselMovies);
            
            const filterText = getActiveFilterText();
            const totalText = totalResults > uniqueMovies.length 
                ? ` (${totalResults} total available)` 
                : '';
            updateSearchStatus(
                `✓ Found ${uniqueMovies.length} movie${uniqueMovies.length !== 1 ? 's' : ''}${filterText}${totalText}`, 
                'success'
            );
        } else {
            carouselMovies = [];
            showCarouselEmpty();
            
            const filterText = getActiveFilterText();
            updateSearchStatus(`No movies found${filterText}. Try different filters or search terms.`, 'error');
        }
    } catch (error) {
        console.error('Search error:', error);
        showCarouselEmpty();
        updateSearchStatus('Search failed. Please try again.', 'error');
        showToast('Failed to search movies', 'error');
    }
}

function getActiveFilterText() {
    const filters = [];
    if (currentFilters.year) filters.push(`year ${currentFilters.year}`);
    if (currentFilters.type) filters.push(currentFilters.type);
    return filters.length > 0 ? ` for ${filters.join(' and ')}` : '';
}

// ============================================
// CAROUSEL DISPLAY
// ============================================
function showCarouselLoading() {
    const section = document.getElementById('movieCarouselSection');
    const carousel = document.getElementById('movieCarousel');
    const loading = document.getElementById('carouselLoading');
    const empty = document.getElementById('carouselEmpty');
    
    section.style.display = 'block';
    carousel.style.display = 'none';
    loading.style.display = 'block';
    empty.style.display = 'none';
}

function showCarouselEmpty() {
    const section = document.getElementById('movieCarouselSection');
    const carousel = document.getElementById('movieCarousel');
    const loading = document.getElementById('carouselLoading');
    const empty = document.getElementById('carouselEmpty');
    
    section.style.display = 'block';
    carousel.style.display = 'none';
    loading.style.display = 'none';
    empty.style.display = 'block';
}

function hideCarousel() {
    const section = document.getElementById('movieCarouselSection');
    section.style.display = 'none';
    carouselMovies = [];
}

function displayCarousel(movies) {
    const section = document.getElementById('movieCarouselSection');
    const carousel = document.getElementById('movieCarousel');
    const loading = document.getElementById('carouselLoading');
    const empty = document.getElementById('carouselEmpty');
    const title = document.getElementById('carouselTitle');
    
    section.style.display = 'block';
    loading.style.display = 'none';
    empty.style.display = 'none';
    carousel.style.display = 'flex';
    
    title.textContent = `Select a Movie (${movies.length} result${movies.length !== 1 ? 's' : ''})`;
    
    carousel.innerHTML = '';
    
    movies.forEach(movie => {
        const posterItem = createPosterItem(movie);
        carousel.appendChild(posterItem);
    });
}

function createPosterItem(movie) {
    const item = document.createElement('div');
    item.className = 'movie-poster-item';
    item.onclick = () => selectMovieFromCarousel(movie);
    
    const posterUrl = movie.Poster && movie.Poster !== 'N/A'
        ? movie.Poster
        : 'https://via.placeholder.com/180x270?text=No+Poster';
    
    item.innerHTML = `
        <img src="${posterUrl}" 
             alt="${escapeHtml(movie.Title)}"
             class="poster-image"
             onerror="this.src='https://via.placeholder.com/180x270?text=No+Poster'">
        <div class="poster-info">
            <div class="poster-title">${escapeHtml(movie.Title)}</div>
            <div class="poster-year">${movie.Year || 'N/A'}</div>
        </div>
    `;
    
    return item;
}

// ============================================
// CAROUSEL NAVIGATION
// ============================================
function scrollCarousel(direction) {
    const carousel = document.getElementById('movieCarousel');
    const scrollAmount = 400;
    
    if (direction === 'left') {
        carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
        carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
}

// ============================================
// MOVIE SELECTION FROM CAROUSEL
// ============================================
async function selectMovieFromCarousel(movie) {
    updateSearchStatus('⏳ Loading movie details...', 'searching');
    
    // Highlight selected poster
    document.querySelectorAll('.movie-poster-item').forEach(item => {
        item.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
    
    // Initialize selected movie with basic info
    selectedMovie = {
        id: movie.imdbID,
        title: movie.Title,
        year: movie.Year || 'N/A',
        poster: movie.Poster !== 'N/A' ? movie.Poster : null,
        director: 'Loading...',
        genre: 'Loading...'
    };
    
    // Display selected movie immediately with loading state
    displaySelectedMovie();
    
    try {
        // Fetch detailed information
        const response = await fetch(
            `${OMDB_BASE_URL}?apikey=${OMDB_API_KEY}&i=${movie.imdbID}&plot=full`
        );
        const details = await response.json();
        
        if (details.Response === 'True') {
            // Update with detailed information
            selectedMovie.director = details.Director && details.Director !== 'N/A'
                ? details.Director
                : 'Unknown';
            
            selectedMovie.genre = details.Genre && details.Genre !== 'N/A'
                ? details.Genre
                : 'Unknown';
            
            if (details.Poster && details.Poster !== 'N/A') {
                selectedMovie.poster = details.Poster;
            }
            
            if (details.Year && details.Year !== 'N/A') {
                selectedMovie.year = details.Year;
            }
            
            // Update display with full details
            displaySelectedMovie();
            updateSearchStatus('✓ Movie selected successfully', 'success');
        } else {
            selectedMovie.director = 'Unknown';
            selectedMovie.genre = 'Unknown';
            displaySelectedMovie();
            updateSearchStatus('⚠ Limited details available', 'warning');
        }
    } catch (error) {
        console.error('Error fetching movie details:', error);
        selectedMovie.director = 'Unknown';
        selectedMovie.genre = 'Unknown';
        displaySelectedMovie();
        updateSearchStatus('⚠ Could not load full details', 'error');
    }
    
    // Scroll to selected movie section
    document.getElementById('selectedMovieDisplay').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
    });
}

function displaySelectedMovie() {
    const display = document.getElementById('selectedMovieDisplay');
    const poster = document.getElementById('selectedPoster');
    const title = document.getElementById('selectedTitle');
    const year = document.getElementById('selectedYear');
    const director = document.getElementById('selectedDirector');
    const genre = document.getElementById('selectedGenre');
    
    display.style.display = 'flex';
    
    poster.src = selectedMovie.poster || 'https://via.placeholder.com/100x150?text=No+Poster';
    poster.onerror = function() {
        this.src = 'https://via.placeholder.com/100x150?text=No+Poster';
    };
    
    title.textContent = selectedMovie.title;
    year.textContent = selectedMovie.year;
    director.textContent = `Directed by ${selectedMovie.director}`;
    genre.textContent = `Genre: ${selectedMovie.genre}`;
}

function clearSelectedMovie() {
    selectedMovie = null;
    document.getElementById('selectedMovieDisplay').style.display = 'none';
    
    // Remove selection highlight
    document.querySelectorAll('.movie-poster-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    updateSearchStatus('Movie deselected. Choose another from the carousel.', 'info');
}

// ============================================
// RATING SYSTEM
// ============================================
function setRating(rating) {
    currentRating = rating;
    const stars = document.querySelectorAll('.star');
    const ratingText = document.getElementById('ratingText');
    
    stars.forEach((star, index) => {
        if (index < rating) {
            star.textContent = '★';
            star.classList.add('active');
        } else {
            star.textContent = '☆';
            star.classList.remove('active');
        }
    });
    
    const ratingLabels = {
        1: 'Poor - Not recommended',
        2: 'Fair - Has some issues',
        3: 'Good - Worth watching',
        4: 'Very Good - Highly enjoyable',
        5: 'Excellent - A masterpiece!'
    };
    
    ratingText.textContent = rating > 0 ? ratingLabels[rating] : 'Select a rating';
}

// ============================================
// CHARACTER COUNTER
// ============================================
function updateCharCount() {
    const textarea = document.getElementById('reviewText');
    const charCount = document.getElementById('charCount');
    const currentLength = textarea.value.length;
    
    charCount.textContent = currentLength;
    
    if (currentLength > 900) {
        charCount.style.color = '#ef4444';
    } else if (currentLength > 800) {
        charCount.style.color = '#f59e0b';
    } else {
        charCount.style.color = '#999';
    }
}

// ============================================
// MODAL MANAGEMENT
// ============================================
function openAddModal() {
    editingReviewId = null;
    selectedMovie = null;
    currentRating = 0;
    carouselMovies = [];
    
    // Reset form
    document.getElementById('reviewForm').reset();
    document.getElementById('selectedMovieDisplay').style.display = 'none';
    document.getElementById('movieCarouselSection').style.display = 'none';
    
    // Reset filters
    document.getElementById('yearFilter').value = '';
    document.getElementById('typeFilter').value = '';
    currentFilters.year = '';
    currentFilters.type = '';
    currentFilters.search = '';
    updateActiveFiltersDisplay();
    updateSearchStatus('');
    
    // Reset rating
    setRating(0);
    
    // Update modal title and show
    document.getElementById('modalTitle').textContent = 'Add Movie Review';
    document.getElementById('reviewModal').classList.add('active');
    
    // Reset character count
    document.getElementById('charCount').textContent = '0';
    document.getElementById('charCount').style.color = '#999';
}

async function openEditModal(reviewId) {
    try {
        const response = await fetch(`${API_BASE_URL}/reviews/user/${currentUserId}`);
        const reviews = await response.json();
        const review = reviews.find(r => r.id === reviewId);
        
        if (!review) {
            showToast('Review not found', 'error');
            return;
        }
        
        editingReviewId = reviewId;
        
        // Set selected movie
        selectedMovie = {
            id: review.movieId,
            title: review.movieTitle,
            year: review.movieYear || 'N/A',
            poster: review.moviePoster,
            director: review.director || 'Unknown',
            genre: review.genre || 'Unknown'
        };
        
        // Display selected movie
        displaySelectedMovie();
        
        // Hide carousel for edit mode
        hideCarousel();
        updateSearchStatus('Editing existing review');
        
        // Set review text
        document.getElementById('reviewText').value = review.reviewText;
        updateCharCount();
        
        // Set rating
        setRating(review.rating);
        
        // Reset filters
        document.getElementById('yearFilter').value = '';
        document.getElementById('typeFilter').value = '';
        document.getElementById('movieSearch').value = '';
        currentFilters.year = '';
        currentFilters.type = '';
        currentFilters.search = '';
        updateActiveFiltersDisplay();
        
        // Update modal title and show
        document.getElementById('modalTitle').textContent = 'Edit Movie Review';
        document.getElementById('reviewModal').classList.add('active');
        
    } catch (error) {
        console.error('Error loading review for edit:', error);
        showToast('Failed to load review', 'error');
    }
}

function closeModal() {
    document.getElementById('reviewModal').classList.remove('active');
    selectedMovie = null;
    editingReviewId = null;
    carouselMovies = [];
    setRating(0);
    
    // Reset everything
    document.getElementById('movieCarouselSection').style.display = 'none';
    document.getElementById('selectedMovieDisplay').style.display = 'none';
    clearAllFilters();
}

// ============================================
// REVIEW SUBMISSION
// ============================================
async function handleSubmitReview(event) {
    event.preventDefault();
    
    // Validation
    if (!selectedMovie) {
        showToast('Please select a movie from the carousel', 'error');
        document.getElementById('movieCarouselSection').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
        return;
    }
    
    if (!currentRating || currentRating < 1) {
        showToast('Please rate the movie', 'error');
        document.getElementById('starRating').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
        return;
    }
    
    const reviewText = document.getElementById('reviewText').value.trim();
    if (!reviewText) {
        showToast('Please write a review', 'error');
        return;
    }
    
    if (reviewText.length < 10) {
        showToast('Review must be at least 10 characters', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = document.getElementById('submitBtn');
    const submitBtnText = document.getElementById('submitBtnText');
    const submitLoader = document.getElementById('submitLoader');
    
    submitBtn.disabled = true;
    submitBtnText.style.display = 'none';
    submitLoader.style.display = 'inline-block';
    
    // Prepare payload
    const payload = {
        movieId: selectedMovie.id,
        movieTitle: selectedMovie.title,
        movieYear: selectedMovie.year,
        moviePoster: selectedMovie.poster,
        director: selectedMovie.director,
        genre: selectedMovie.genre,
        rating: currentRating,
        reviewText: reviewText
    };
    
    try {
        const url = editingReviewId
            ? `${API_BASE_URL}/reviews/${editingReviewId}/user/${currentUserId}`
            : `${API_BASE_URL}/reviews/user/${currentUserId}`;
        
        const method = editingReviewId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message || (editingReviewId ? 'Review updated successfully' : 'Review added successfully'), 'success');
            closeModal();
            loadUserReviews();
        } else {
            showToast(data.message || 'Failed to save review', 'error');
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        showToast('Failed to save review. Please try again.', 'error');
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtnText.style.display = 'inline';
        submitLoader.style.display = 'none';
    }
}

// ============================================
// REVIEW DELETION
// ============================================
let deleteReviewId = null;

function deleteReview(id) {
    deleteReviewId = id;
    document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
    deleteReviewId = null;
    document.getElementById('deleteModal').classList.remove('active');
}

async function confirmDeleteReview() {
    if (!deleteReviewId) return;
    
    try {
        const response = await fetch(
            `${API_BASE_URL}/reviews/${deleteReviewId}/user/${currentUserId}`,
            { method: 'DELETE' }
        );
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Review deleted successfully', 'success');
            closeDeleteModal();
            loadUserReviews();
        } else {
            showToast(data.message || 'Failed to delete review', 'error');
        }
    } catch (error) {
        console.error('Error deleting review:', error);
        showToast('Failed to delete review. Please try again.', 'error');
    }
}

// ============================================
// LOGOUT
// ============================================
function handleLogout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// ============================================
// EVENT LISTENERS
// ============================================

// Close modals on background click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        if (e.target.id === 'reviewModal') {
            closeModal();
        } else if (e.target.id === 'deleteModal') {
            closeDeleteModal();
        }
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Close modal on Escape
    if (e.key === 'Escape') {
        const reviewModal = document.getElementById('reviewModal');
        const deleteModal = document.getElementById('deleteModal');
        
        if (reviewModal.classList.contains('active')) {
            closeModal();
        } else if (deleteModal.classList.contains('active')) {
            closeDeleteModal();
        }
    }
    
    // Enter on search to apply filters (when not in textarea)
    if (e.key === 'Enter' && e.target.id === 'movieSearch') {
        e.preventDefault();
        applyFilters();
    }
});