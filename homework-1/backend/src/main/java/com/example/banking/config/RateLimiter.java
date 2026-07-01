package com.example.banking.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory, per-key fixed-window rate limiter (Task 4D). Both the limit and the window are
 * configurable so tests can drive it with a small limit. Thread-safe per key.
 */
@Component
public class RateLimiter {

    private final int limit;
    private final long windowMillis;
    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    public RateLimiter(@Value("${ratelimit.limit:100}") int limit,
                       @Value("${ratelimit.window-seconds:60}") long windowSeconds) {
        this.limit = limit;
        this.windowMillis = windowSeconds * 1000L;
    }

    /** Records a request for the key and returns true if it is within the allowed limit. */
    public boolean tryAcquire(String key) {
        long now = System.currentTimeMillis();
        Window window = windows.computeIfAbsent(key, k -> new Window(now));
        synchronized (window) {
            if (now - window.start >= windowMillis) {
                window.start = now;
                window.count = 0;
            }
            window.count++;
            return window.count <= limit;
        }
    }

    public int getLimit() {
        return limit;
    }

    /** Clears all counters. Used to isolate tests. */
    public void reset() {
        windows.clear();
    }

    private static final class Window {
        private long start;
        private int count;

        private Window(long start) {
            this.start = start;
        }
    }
}
