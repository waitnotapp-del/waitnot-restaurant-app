// IndexedDB wrapper for voice assistant requests
class VoiceStorage {
  constructor() {
    this.dbName = 'VoiceAssistantDB';
    this.version = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create requests store
        if (!db.objectStoreNames.contains('requests')) {
          const store = db.createObjectStore('requests', { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async saveRequest(request) {
    const transaction = this.db.transaction(['requests'], 'readwrite');
    const store = transaction.objectStore('requests');
    return store.put(request);
  }

  async updateRequest(id, updates) {
    const transaction = this.db.transaction(['requests'], 'readwrite');
    const store = transaction.objectStore('requests');
    
    const request = await this.getRequest(id);
    if (request) {
      const updatedRequest = { ...request, ...updates, updatedAt: Date.now() };
      return store.put(updatedRequest);
    }
  }

  async getRequest(id) {
    const transaction = this.db.transaction(['requests'], 'readonly');
    const store = transaction.objectStore('requests');
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingRequests() {
    const transaction = this.db.transaction(['requests'], 'readonly');
    const store = transaction.objectStore('requests');
    const index = store.index('status');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll('collecting');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllRequests() {
    const transaction = this.db.transaction(['requests'], 'readonly');
    const store = transaction.objectStore('requests');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteRequest(id) {
    const transaction = this.db.transaction(['requests'], 'readwrite');
    const store = transaction.objectStore('requests');
    return store.delete(id);
  }

  generateRequestId() {
    return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  createRequest(foodName, userId = null) {
    return {
      id: this.generateRequestId(),
      userId: userId,
      foodName: foodName,
      vegOption: null, // "veg" | "nonveg" | null
      quantity: null,
      userLocation: null,
      timestamp: Date.now(),
      status: 'collecting', // collecting -> searching -> found -> ordered -> completed -> cancelled
      results: [],
      selectedRestaurantId: null,
      attempts: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }
}

export default VoiceStorage;