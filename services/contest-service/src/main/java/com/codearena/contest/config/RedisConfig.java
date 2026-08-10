package com.codearena.contest.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericToStringSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {

    @Value("${spring.data.redis.url:}")
    private String redisUrl;

    @Value("${spring.data.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    @Value("${spring.data.redis.password:}")
    private String redisPassword;

    @Bean
    public LettuceConnectionFactory redisConnectionFactory() {
        // Support both REDIS_URL (cloud) and separate vars (local)
        if (redisUrl != null && !redisUrl.isEmpty()) {
            // Cloud Redis URL format: redis://default:password@host.upstash.io:6379
            // Parse URL and create configuration
            RedisStandaloneConfiguration config = parseRedisUrl(redisUrl);
            return new LettuceConnectionFactory(config);
        } else {
            // Local development with separate variables
            RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
            config.setHostName(redisHost);
            config.setPort(redisPort);
            if (!redisPassword.isEmpty()) {
                config.setPassword(redisPassword);
            }
            return new LettuceConnectionFactory(config);
        }
    }

    private RedisStandaloneConfiguration parseRedisUrl(String url) {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
        
        try {
            // Parse URL format: redis://default:password@host:port
            // or: rediss://default:password@host:port (SSL)
            String cleanUrl = url.replace("redis://", "").replace("rediss://", "");
            
            // Split by @ to separate credentials from host:port
            String[] parts = cleanUrl.split("@");
            if (parts.length == 2) {
                String[] credentials = parts[0].split(":");
                if (credentials.length >= 2) {
                    config.setPassword(credentials[1]);
                }
                
                // Parse host:port
                String[] hostPort = parts[1].split(":");
                config.setHostName(hostPort[0]);
                if (hostPort.length > 1) {
                    config.setPort(Integer.parseInt(hostPort[1]));
                }
            } else {
                // Simple format without credentials
                String[] hostPort = parts[0].split(":");
                config.setHostName(hostPort[0]);
                if (hostPort.length > 1) {
                    config.setPort(Integer.parseInt(hostPort[1]));
                }
            }
        } catch (Exception e) {
            // Fallback to localhost if parsing fails
            config.setHostName("localhost");
            config.setPort(6379);
        }
        
        return config;
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate() {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(redisConnectionFactory());
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericToStringSerializer<>(Object.class));
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(new GenericToStringSerializer<>(Object.class));
        return template;
    }
}
