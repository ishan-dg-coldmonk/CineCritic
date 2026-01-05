package com.moviereview.service;

import com.moviereview.dto.ReviewRequest;
import com.moviereview.model.Review;
import com.moviereview.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    public List<Review> getUserReviews(Long userId) {
        return reviewRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Map<String, Object> createReview(Long userId, ReviewRequest request) {
        Map<String, Object> response = new HashMap<>();

        Review review = new Review();
        review.setUserId(userId);
        review.setMovieId(request.getMovieId());
        review.setMovieTitle(request.getMovieTitle());
        review.setMoviePoster(request.getMoviePoster());
        review.setDirector(request.getDirector());
        review.setRating(request.getRating());
        review.setReviewText(request.getReviewText());

        Review savedReview = reviewRepository.save(review);

        response.put("success", true);
        response.put("message", "Review created successfully");
        response.put("review", savedReview);

        return response;
    }

    public Map<String, Object> updateReview(Long reviewId, Long userId, ReviewRequest request) {
        Map<String, Object> response = new HashMap<>();

        Optional<Review> reviewOpt = reviewRepository.findById(reviewId);

        if (reviewOpt.isEmpty()) {
            response.put("success", false);
            response.put("message", "Review not found");
            return response;
        }

        Review review = reviewOpt.get();

        if (!review.getUserId().equals(userId)) {
            response.put("success", false);
            response.put("message", "Unauthorized");
            return response;
        }

        review.setRating(request.getRating());
        review.setReviewText(request.getReviewText());

        Review updatedReview = reviewRepository.save(review);

        response.put("success", true);
        response.put("message", "Review updated successfully");
        response.put("review", updatedReview);

        return response;
    }

    public Map<String, Object> deleteReview(Long reviewId, Long userId) {
        Map<String, Object> response = new HashMap<>();

        Optional<Review> reviewOpt = reviewRepository.findById(reviewId);

        if (reviewOpt.isEmpty()) {
            response.put("success", false);
            response.put("message", "Review not found");
            return response;
        }

        Review review = reviewOpt.get();

        if (!review.getUserId().equals(userId)) {
            response.put("success", false);
            response.put("message", "Unauthorized");
            return response;
        }

        reviewRepository.delete(review);

        response.put("success", true);
        response.put("message", "Review deleted successfully");

        return response;
    }
}