package com.moviereview.service;

import com.moviereview.dto.LoginRequest;
import com.moviereview.dto.SignupRequest;
import com.moviereview.model.User;
import com.moviereview.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Map<String, Object> signup(SignupRequest request) {
        Map<String, Object> response = new HashMap<>();

        if (userRepository.existsByUsername(request.getUsername())) {
            response.put("success", false);
            response.put("message", "Username already exists");
            return response;
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            response.put("success", false);
            response.put("message", "Email already exists");
            return response;
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword())); // Hash the password

        User savedUser = userRepository.save(user);

        response.put("success", true);
        response.put("message", "User registered successfully");
        response.put("userId", savedUser.getId());
        response.put("username", savedUser.getUsername());

        return response;
    }

    public Map<String, Object> login(LoginRequest request) {
        Map<String, Object> response = new HashMap<>();

        Optional<User> userOpt = userRepository.findByUsername(request.getUsername());

        if (userOpt.isEmpty()) {
            response.put("success", false);
            response.put("message", "Invalid username or password");
            return response;
        }

        User user = userOpt.get();

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            response.put("success", false);
            response.put("message", "Invalid username or password");
            return response;
        }

        response.put("success", true);
        response.put("message", "Login successful");
        response.put("userId", user.getId());
        response.put("username", user.getUsername());

        return response;
    }
}