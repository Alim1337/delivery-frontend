// Simple in-memory cache to avoid repeated API calls
const cache = new Map();
const CACHE_TTL = 30000; // 30 seconds

export const cachedFetch = async (key, fetchFn, ttl = CACHE_TTL) => {
  const now = Date.now();
  const cached = cache.get(key);

  if (cached && now - cached.timestamp < ttl) {
    return cached.data;
  }

  const data = await fetchFn();
  cache.set(key, { data, timestamp: now });
  return data;
};

export const invalidateCache = (key) => {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
};

export const invalidatePattern = (pattern) => {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key);
  }
};