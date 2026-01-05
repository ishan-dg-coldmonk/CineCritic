const API_BASE_URL = 'http://localhost:8081/api';

// OMDb configuration
const OMDB_API_KEY = '565370ed';
const OMDB_BASE_URL = 'http://www.omdbapi.com/';

let currentUserId = null;
let currentUsername = null;
let selectedMovie = null;
let currentRating = 0;
let editingReviewId = null;
let searchTimeout = null;

// Initialize page
window.addEventListener('DOMContentLoaded', () => {
    currentUserId = localStorage.getItem('userId');
    currentUsername = localStorage.getItem('username');

    if (!currentUserId) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('usernameDisplay').textContent = `👋 ${currentUsername}`;
    loadUserReviews();
});

// Toast
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Load reviews
async function loadUserReviews() {
    const container = document.getElementById('reviewsContainer');
    const emptyState = document.getElementById('emptyState');

    try {
        const response = await fetch(`${API_BASE_URL}/reviews/user/${currentUserId}`);
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

        reviews.forEach(r => container.appendChild(createReviewCard(r)));
    } catch {
        showToast('Failed to load reviews', 'error');
    }
}

// Review card
function createReviewCard(review) {
    const card = document.createElement('div');
    card.className = 'review-card';

    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    const date = new Date(review.createdAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    card.innerHTML = `
        <img src="${review.moviePoster || 'https://via.placeholder.com/300x450?text=No+Poster'}"
             class="review-card-poster">
        <div class="review-card-content">
            <h3>${review.movieTitle}</h3>
            <p>Directed by ${review.director || 'Unknown'}</p>
            <div class="review-card-rating">${stars}</div>
            <p>${review.reviewText}</p>
            <p class="review-card-date">Reviewed on ${date}</p>
            <div class="review-card-actions">
                <button class="btn-edit" onclick="openEditModal(${review.id})">Edit</button>
                <button class="btn-delete" onclick="deleteReview(${review.id})">Delete</button>
            </div>
        </div>
    `;
    return card;
}

// =======================
// OMDb SEARCH
// =======================

async function searchMovies() {
    const query = document.getElementById('movieSearch').value.trim();
    const container = document.getElementById('movieSuggestions');

    if (query.length < 2) {
        container.classList.remove('active');
        return;
    }

    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(async () => {
        try {
            const res = await fetch(
                `${OMDB_BASE_URL}?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(query)}`
            );
            const data = await res.json();
            displaySuggestions(data.Search || []);
        } catch (err) {
            console.error('OMDb search error', err);
        }
    }, 400);
}

function displaySuggestions(movies) {
    const container = document.getElementById('movieSuggestions');

    if (!movies.length) {
        container.classList.remove('active');
        return;
    }

    container.innerHTML = '';
    container.classList.add('active');

    movies.slice(0, 5).forEach(movie => {
        const poster =
            movie.Poster && movie.Poster !== 'N/A'
                ? movie.Poster
                : 'https://via.placeholder.com/50x75?text=No+Image';

        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.onclick = () => selectMovie(movie);

        item.innerHTML = `
            <img src="${poster}" class="suggestion-poster">
            <div class="suggestion-info">
                <h4>${movie.Title}</h4>
                <p>${movie.Year}</p>
            </div>
        `;

        container.appendChild(item);
    });
}

// Select movie
async function selectMovie(movie) {
    selectedMovie = {
        id: movie.imdbID,
        title: movie.Title,
        poster: movie.Poster !== 'N/A' ? movie.Poster : null,
        director: 'Loading...'
    };

    try {
        const res = await fetch(
            `${OMDB_BASE_URL}?apikey=${OMDB_API_KEY}&i=${movie.imdbID}`
        );
        const details = await res.json();

        selectedMovie.director =
            details.Director && details.Director !== 'N/A'
                ? details.Director
                : 'Unknown';

        if (details.Poster && details.Poster !== 'N/A') {
            selectedMovie.poster = details.Poster;
        }
    } catch {
        selectedMovie.director = 'Unknown';
    }

    document.getElementById('movieSearch').value = '';
    document.getElementById('movieSuggestions').classList.remove('active');

    document.getElementById('selectedMovieDisplay').style.display = 'flex';
    document.getElementById('selectedPoster').src =
        selectedMovie.poster || 'https://via.placeholder.com/80x120?text=No+Poster';
    document.getElementById('selectedTitle').textContent = selectedMovie.title;
    document.getElementById('selectedDirector').textContent =
        `Directed by ${selectedMovie.director}`;
}

// =======================
// RATING + MODAL
// =======================

function setRating(rating) {
    currentRating = rating;
    document.querySelectorAll('.star').forEach((star, i) => {
        star.textContent = i < rating ? '★' : '☆';
        star.classList.toggle('active', i < rating);
    });
}

function openAddModal() {
    editingReviewId = null;
    selectedMovie = null;
    currentRating = 0;

    document.getElementById('reviewForm').reset();
    document.getElementById('selectedMovieDisplay').style.display = 'none';
    document.getElementById('modalTitle').textContent = 'Add Movie Review';
    document.getElementById('reviewModal').classList.add('active');
    setRating(0);
}

async function openEditModal(reviewId) {
    const res = await fetch(`${API_BASE_URL}/reviews/user/${currentUserId}`);
    const reviews = await res.json();
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;

    editingReviewId = reviewId;
    selectedMovie = {
        id: review.movieId,
        title: review.movieTitle,
        poster: review.moviePoster,
        director: review.director
    };

    document.getElementById('selectedMovieDisplay').style.display = 'flex';
    document.getElementById('selectedPoster').src =
        review.moviePoster || 'https://via.placeholder.com/80x120';
    document.getElementById('selectedTitle').textContent = review.movieTitle;
    document.getElementById('selectedDirector').textContent =
        `Directed by ${review.director || 'Unknown'}`;
    document.getElementById('reviewText').value = review.reviewText;

    setRating(review.rating);
    document.getElementById('modalTitle').textContent = 'Edit Movie Review';
    document.getElementById('reviewModal').classList.add('active');
}

function closeModal() {
    document.getElementById('reviewModal').classList.remove('active');
    selectedMovie = null;
    editingReviewId = null;
    setRating(0);
}

// =======================
// SUBMIT / DELETE
// =======================

async function handleSubmitReview(e) {
    e.preventDefault();

    if (!selectedMovie) return showToast('Select a movie', 'error');
    if (!currentRating) return showToast('Rate the movie', 'error');

    const payload = {
        movieId: selectedMovie.id,
        movieTitle: selectedMovie.title,
        moviePoster: selectedMovie.poster,
        director: selectedMovie.director,
        rating: currentRating,
        reviewText: document.getElementById('reviewText').value
    };

    const url = editingReviewId
        ? `${API_BASE_URL}/reviews/${editingReviewId}/user/${currentUserId}`
        : `${API_BASE_URL}/reviews/user/${currentUserId}`;

    const method = editingReviewId ? 'PUT' : 'POST';

    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await res.json();
    data.success ? showToast(data.message) : showToast(data.message, 'error');

    if (data.success) {
        closeModal();
        loadUserReviews();
    }
}

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
        const res = await fetch(
            `${API_BASE_URL}/reviews/${deleteReviewId}/user/${currentUserId}`,
            { method: 'DELETE' }
        );

        const data = await res.json();

        if (data.success) {
            showToast('Review deleted successfully');
            closeDeleteModal();
            loadUserReviews();
        } else {
            showToast(data.message, 'error');
        }
    } catch {
        showToast('Failed to delete review', 'error');
    }
}


// Logout
function handleLogout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

// Close suggestions on outside click
document.addEventListener('click', e => {
    const box = document.getElementById('movieSuggestions');
    const input = document.getElementById('movieSearch');
    if (!box.contains(e.target) && e.target !== input) {
        box.classList.remove('active');
    }
});
