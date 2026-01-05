package com.moviereview.controller;

import com.moviereview.dto.ReviewRequest;
import com.moviereview.model.Review;
import com.moviereview.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Review>> getUserReviews(@PathVariable Long userId) {
        List<Review> reviews = reviewService.getUserReviews(userId);
        return ResponseEntity.ok(reviews);
    }

    @PostMapping("/user/{userId}")
    public ResponseEntity<Map<String, Object>> createReview(
            @PathVariable Long userId,
            @RequestBody ReviewRequest request) {
        Map<String, Object> response = reviewService.createReview(userId, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{reviewId}/user/{userId}")
    public ResponseEntity<Map<String, Object>> updateReview(
            @PathVariable Long reviewId,
            @PathVariable Long userId,
            @RequestBody ReviewRequest request) {
        Map<String, Object> response = reviewService.updateReview(reviewId, userId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{reviewId}/user/{userId}")
    public ResponseEntity<Map<String, Object>> deleteReview(
            @PathVariable Long reviewId,
            @PathVariable Long userId) {
        Map<String, Object> response = reviewService.deleteReview(reviewId, userId);
        return ResponseEntity.ok(response);
    }
}