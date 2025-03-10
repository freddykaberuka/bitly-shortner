package com.awesome.urlshortener.gateway.services;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

import javax.annotation.PostConstruct;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class JwtUtils {
    @Value("${jwt.secret}")
    private String secret;

    private final ObjectMapper mapper = new ObjectMapper();

    private Key key;

    @PostConstruct
    public void initKey() {
        if (secret.getBytes().length < 32) {
            secret = String.format("%-32s", secret).substring(0, 32);
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
    }

    public Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public boolean isExpired(String token) {
        try {
            return getClaims(token).getExpiration().before(new Date());
        } catch (Exception e) {
            return true;
        }
    }

    public String getUserId(String token) {
        try {
            Map<String, String> payload = mapper.convertValue(getClaims(token), HashMap.class);
            return payload.get("id");
        } catch (Exception e) {
            log.error("Error fetching user ID from token: {}", e.getMessage());
            return null;
        }
    }
}
