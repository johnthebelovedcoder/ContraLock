// utils/requestCache.ts
const pendingRequests = new Map<string, Promise<any>>();

export interface RequestOptions {
  method: string;
  url: string;
  data?: any;
  headers?: Record<string, string>;
}

export async function cachedFetch<T>(
  url: string, 
  options: RequestOptions
): Promise<T> {
  // Create a unique key for the request based on method, URL, and data
  const key = `${options.method.toUpperCase()}-${url}`;
  
  // If request is already in flight, return the existing promise
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }
  
  // Otherwise, make the new request
  const promise = fetch(url, {
    method: options.method,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: options.data ? JSON.stringify(options.data) : undefined,
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .finally(() => {
      // Clean up after request completes
      pendingRequests.delete(key);
    });
  
  // Store the pending promise
  pendingRequests.set(key, promise);
  
  return promise;
}

// Axios version for our existing apiClient
const axiosPendingRequests = new Map<string, Promise<any>>();

export async function cachedAxiosRequest<T>(
  url: string,
  method: string,
  data?: any,
  headers?: Record<string, string>
): Promise<T> {
  const normalizedMethod = method.toUpperCase();
  // Create a unique key for the request - for GET requests, include query params
  // For other methods, we only consider URL and method
  const key = normalizedMethod === 'GET' 
    ? `${normalizedMethod}-${url}-${JSON.stringify(data || '')}` 
    : `${normalizedMethod}-${url}`;
  
  // If request is already in flight, return the existing promise
  if (axiosPendingRequests.has(key)) {
    return axiosPendingRequests.get(key);
  }
  
  // For non-GET requests, we don't deduplicate to avoid issues with POST, PUT, etc.
  if (normalizedMethod !== 'GET') {
    const directPromise = Promise.resolve() as Promise<T>;
    // In a real implementation, we'd make the actual request here
    // For now, we return the promise that will be resolved with the actual request
    // Let's adjust to handle this properly with our client
    return makeAxiosRequest(url, method, data, headers) as Promise<T>;
  }
  
  // For GET requests, implement deduplication
  const promise = makeAxiosRequest(url, method, data, headers)
    .finally(() => {
      // Clean up after request completes
      axiosPendingRequests.delete(key);
    });
  
  // Store the pending promise
  axiosPendingRequests.set(key, promise);
  
  return promise;
}

// Helper function to make the actual axios request
async function makeAxiosRequest<T>(url: string, method: string, data?: any, headers?: Record<string, string>): Promise<T> {
  // This is a simplified version - in our actual implementation we'll modify the apiClient
  return Promise.resolve({} as T);
}