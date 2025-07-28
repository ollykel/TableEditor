package com.example.hello.filter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.example.hello.util.JwtUtil;
import com.example.hello.repository.UserRepository;
import com.example.hello.entity.UserEntity;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtUtil.isValid(token)) {
                String                username = jwtUtil.extractUsername(token);
                Long                  uid = jwtUtil.extractUid(token);
                Optional<UserEntity>  userOpt = this.userRepository.findById(uid);

                if (userOpt.isPresent()) {
                  UserEntity  user = userOpt.get();
                  UsernamePasswordAuthenticationToken authentication =
                      new UsernamePasswordAuthenticationToken(username, null, List.of());
                  SecurityContextHolder.getContext().setAuthentication(authentication);
                  request.setAttribute("username", username);
                  request.setAttribute("uid", uid);
                  request.setAttribute("user", user);
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
