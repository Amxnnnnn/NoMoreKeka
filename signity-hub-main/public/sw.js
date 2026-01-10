/**
 * SERVICE WORKER FOR OFFLINE FUNCTIONALITY
 * 
 * Provides offline support, caching strategies, and background sync
 * for the HRMS application
 */

const CACHE_NAME = 'hrms-v1';
const STATIC_CACHE = 'hrms-static-v1';
const DYNAMIC_CACHE = 'hrms-dynamic-v1';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  // Add other static assets as needed
];

// API endpoints that should be cached
const CACHEABLE_APIS = [
  '/api/profile',
  '/api/dashboard',
  '/api/leave/balance',
  '/api/teams/my',
  '/api/projects/my',
  '/api/tasks/my',
  '/api/notifications'
];

// Background sync tags
const SYNC_TAGS = {
  LEAVE_APPLICATION: 'leave-application',
  WORKLOG_ENTRY: 'worklog-entry',
  TASK_UPDATE: 'task-update',
  NOTIFICATION_READ: 'notification-read'
};

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

/**
 * Fetch event - handle network requests with caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.endsWith(asset))) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Handle other requests (SPA routing)
  event.respondWith(handleNavigationRequest(request));
});

/**
 * Handle API requests with cache-first or network-first strategy
 */
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const isCacheable = CACHEABLE_APIS.some(api => url.pathname.startsWith(api));

  if (isCacheable) {
    // Cache-first strategy for cacheable APIs
    try {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        // Return cached response and update in background
        updateCacheInBackground(request);
        return cachedResponse;
      }
    } catch (error) {
      console.warn('Service Worker: Cache lookup failed', error);
    }
  }

  // Network-first strategy
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && isCacheable) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('Service Worker: Network request failed', error);
    
    // Return cached response if available
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response
    return new Response(
      JSON.stringify({
        success: false,
        message: 'You are offline. Please check your connection.',
        offline: true
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Handle static asset requests with cache-first strategy
 */
async function handleStaticRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
  } catch (error) {
    console.warn('Service Worker: Static cache lookup failed', error);
  }

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('Service Worker: Static network request failed', error);
    
    // Return cached response if available
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    return caches.match('/index.html');
  }
}

/**
 * Handle navigation requests (SPA routing)
 */
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.warn('Service Worker: Navigation request failed', error);
    
    // Return cached index.html for SPA routing
    const cachedResponse = await caches.match('/index.html');
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback offline page
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Offline - HRMS</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .offline-message { max-width: 400px; margin: 0 auto; }
            .retry-btn { 
              background: #007bff; color: white; border: none; 
              padding: 10px 20px; border-radius: 5px; cursor: pointer; 
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="offline-message">
            <h1>You're Offline</h1>
            <p>Please check your internet connection and try again.</p>
            <button class="retry-btn" onclick="window.location.reload()">Retry</button>
          </div>
        </body>
      </html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

/**
 * Update cache in background
 */
async function updateCacheInBackground(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
  } catch (error) {
    console.warn('Service Worker: Background cache update failed', error);
  }
}

/**
 * Background sync event - handle offline actions
 */
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  switch (event.tag) {
    case SYNC_TAGS.LEAVE_APPLICATION:
      event.waitUntil(syncLeaveApplications());
      break;
    case SYNC_TAGS.WORKLOG_ENTRY:
      event.waitUntil(syncWorkLogEntries());
      break;
    case SYNC_TAGS.TASK_UPDATE:
      event.waitUntil(syncTaskUpdates());
      break;
    case SYNC_TAGS.NOTIFICATION_READ:
      event.waitUntil(syncNotificationReads());
      break;
    default:
      console.warn('Service Worker: Unknown sync tag', event.tag);
  }
});

/**
 * Sync leave applications
 */
async function syncLeaveApplications() {
  try {
    const pendingApplications = await getStoredData('pendingLeaveApplications') || [];
    
    for (const application of pendingApplications) {
      try {
        const response = await fetch('/api/leave', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getAuthToken()}`
          },
          body: JSON.stringify(application.data)
        });
        
        if (response.ok) {
          // Remove from pending queue
          await removeStoredData('pendingLeaveApplications', application.id);
          
          // Notify client of success
          await notifyClients({
            type: 'SYNC_SUCCESS',
            entity: 'leave',
            action: 'create',
            data: application.data
          });
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync leave application', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Leave application sync failed', error);
  }
}

/**
 * Sync work log entries
 */
async function syncWorkLogEntries() {
  try {
    const pendingEntries = await getStoredData('pendingWorkLogEntries') || [];
    
    for (const entry of pendingEntries) {
      try {
        const response = await fetch('/api/worklog', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getAuthToken()}`
          },
          body: JSON.stringify(entry.data)
        });
        
        if (response.ok) {
          await removeStoredData('pendingWorkLogEntries', entry.id);
          
          await notifyClients({
            type: 'SYNC_SUCCESS',
            entity: 'worklog',
            action: 'create',
            data: entry.data
          });
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync work log entry', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Work log sync failed', error);
  }
}

/**
 * Sync task updates
 */
async function syncTaskUpdates() {
  try {
    const pendingUpdates = await getStoredData('pendingTaskUpdates') || [];
    
    for (const update of pendingUpdates) {
      try {
        const response = await fetch(`/api/tasks/${update.taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getAuthToken()}`
          },
          body: JSON.stringify(update.data)
        });
        
        if (response.ok) {
          await removeStoredData('pendingTaskUpdates', update.id);
          
          await notifyClients({
            type: 'SYNC_SUCCESS',
            entity: 'task',
            action: 'update',
            data: { id: update.taskId, ...update.data }
          });
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync task update', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Task update sync failed', error);
  }
}

/**
 * Sync notification reads
 */
async function syncNotificationReads() {
  try {
    const pendingReads = await getStoredData('pendingNotificationReads') || [];
    
    for (const read of pendingReads) {
      try {
        const response = await fetch(`/api/notifications/${read.notificationId}/read`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${await getAuthToken()}`
          }
        });
        
        if (response.ok) {
          await removeStoredData('pendingNotificationReads', read.id);
          
          await notifyClients({
            type: 'SYNC_SUCCESS',
            entity: 'notification',
            action: 'read',
            data: { id: read.notificationId }
          });
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync notification read', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Notification read sync failed', error);
  }
}

/**
 * Message event - handle messages from clients
 */
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'QUEUE_OFFLINE_ACTION':
      handleOfflineAction(data);
      break;
    case 'GET_CACHE_STATUS':
      event.ports[0].postMessage(getCacheStatus());
      break;
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
    default:
      console.warn('Service Worker: Unknown message type', type);
  }
});

/**
 * Handle offline actions
 */
async function handleOfflineAction(action) {
  const { type, entity, data } = action;
  const actionId = generateId();
  
  switch (entity) {
    case 'leave':
      await storeData('pendingLeaveApplications', { id: actionId, data });
      await registerBackgroundSync(SYNC_TAGS.LEAVE_APPLICATION);
      break;
    case 'worklog':
      await storeData('pendingWorkLogEntries', { id: actionId, data });
      await registerBackgroundSync(SYNC_TAGS.WORKLOG_ENTRY);
      break;
    case 'task':
      await storeData('pendingTaskUpdates', { id: actionId, taskId: data.id, data });
      await registerBackgroundSync(SYNC_TAGS.TASK_UPDATE);
      break;
    case 'notification':
      await storeData('pendingNotificationReads', { id: actionId, notificationId: data.id });
      await registerBackgroundSync(SYNC_TAGS.NOTIFICATION_READ);
      break;
  }
}

/**
 * Utility functions
 */
async function getStoredData(key) {
  try {
    const cache = await caches.open('offline-data');
    const response = await cache.match(`/offline-data/${key}`);
    if (response) {
      return await response.json();
    }
  } catch (error) {
    console.error('Service Worker: Failed to get stored data', error);
  }
  return null;
}

async function storeData(key, data) {
  try {
    const cache = await caches.open('offline-data');
    const existingData = await getStoredData(key) || [];
    const updatedData = Array.isArray(existingData) ? [...existingData, data] : [data];
    
    await cache.put(
      `/offline-data/${key}`,
      new Response(JSON.stringify(updatedData), {
        headers: { 'Content-Type': 'application/json' }
      })
    );
  } catch (error) {
    console.error('Service Worker: Failed to store data', error);
  }
}

async function removeStoredData(key, id) {
  try {
    const existingData = await getStoredData(key) || [];
    const updatedData = existingData.filter(item => item.id !== id);
    
    const cache = await caches.open('offline-data');
    await cache.put(
      `/offline-data/${key}`,
      new Response(JSON.stringify(updatedData), {
        headers: { 'Content-Type': 'application/json' }
      })
    );
  } catch (error) {
    console.error('Service Worker: Failed to remove stored data', error);
  }
}

async function getAuthToken() {
  try {
    const cache = await caches.open('auth-data');
    const response = await cache.match('/auth-token');
    if (response) {
      const data = await response.json();
      return data.token;
    }
  } catch (error) {
    console.error('Service Worker: Failed to get auth token', error);
  }
  return null;
}

async function registerBackgroundSync(tag) {
  try {
    await self.registration.sync.register(tag);
  } catch (error) {
    console.error('Service Worker: Failed to register background sync', error);
  }
}

async function notifyClients(message) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage(message);
  });
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getCacheStatus() {
  return caches.keys().then(cacheNames => ({
    caches: cacheNames,
    timestamp: Date.now()
  }));
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
}