package com.petcare.global.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtTokenProvider {

	private final SecretKey key;
	private final long expiration;
	private final long refreshExpiration;

	public JwtTokenProvider(
			@Value("${jwt.secret}") String secret,
			@Value("${jwt.expiration}") long expiration,
			@Value("${jwt.refresh-expiration}") long refreshExpiration) {
		this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
		this.expiration = expiration;
		this.refreshExpiration = refreshExpiration;
	}

	public String generateToken(String email) {
		Date now = new Date();
		Date validity = new Date(now.getTime() + expiration);

		return Jwts.builder()
				.subject(email)
				.issuedAt(now)
				.expiration(validity)
				.signWith(key)
				.compact();
	}

	public long getExpiration() {
		return expiration;
	}

	public long getRefreshExpiration() {
		return refreshExpiration;
	}

	public String getEmail(String token) {
		return parseClaims(token).getSubject();
	}

	public boolean isValid(String token) {
		try {
			parseClaims(token);
			return true;
		} catch (JwtException | IllegalArgumentException e) {
			return false;
		}
	}

	private Claims parseClaims(String token) {
		return Jwts.parser()
				.verifyWith(key)
				.build()
				.parseSignedClaims(token)
				.getPayload();
	}
}
