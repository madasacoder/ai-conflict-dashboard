/**
 * History Manager for AI Conflict Dashboard
 * Uses IndexedDB for efficient storage of response history
 */

class HistoryManager {
    constructor() {
        this.dbName = 'AIConflictDashboard';
        this.dbVersion = 1;
        this.storeName = 'responseHistory';
        this.db = null;
        this.maxItems = 50; // Keep last 50 comparisons
        this.maxStorageSize = 50 * 1024 * 1024; // 50MB limit
    }

    /**
     * Initialize IndexedDB connection
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('Failed to open IndexedDB', request.error);
                reject(request.error);
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    
                    // Create indexes for searching
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('prompt', 'prompt', { unique: false });
                    store.createIndex('starred', 'starred', { unique: false });
                }
            };
        });
    }

    /**
     * Save a response comparison to history
     */
    async save(data) {
        if (!this.db) await this.init();
        
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        const historyItem = {
            timestamp: new Date().toISOString(),
            prompt: data.original_text.substring(0, 200), // Store first 200 chars as preview
            fullPrompt: data.original_text,
            responses: data.responses,
            requestId: data.request_id,
            chunked: data.chunked || false,
            chunkInfo: data.chunk_info || null,
            starred: false,
            tags: [],
            metadata: {
                modelCount: data.responses.length,
                hasErrors: data.responses.some(r => r.error),
                successfulModels: data.responses.filter(r => !r.error).map(r => r.model)
            }
        };
        
        return new Promise((resolve, reject) => {
            const request = store.add(historyItem);
            
            request.onsuccess = async () => {
                // Clean up old items if necessary
                await this.cleanup();
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error('Failed to save to history', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get all history items
     */
    async getAll() {
        if (!this.db) await this.init();
        
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const index = store.index('timestamp');
        
        return new Promise((resolve, reject) => {
            const items = [];
            const request = index.openCursor(null, 'prev'); // Sort by timestamp descending
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    items.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(items);
                }
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Get a single history item by ID
     */
    async getById(id) {
        if (!this.db) await this.init();
        
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Search history by prompt text
     */
    async search(query) {
        if (!this.db) await this.init();
        
        const allItems = await this.getAll();
        const lowerQuery = query.toLowerCase();
        
        return allItems.filter(item => {
            return item.fullPrompt.toLowerCase().includes(lowerQuery) ||
                   item.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
        });
    }

    /**
     * Toggle star status for an item
     */
    async toggleStar(id) {
        if (!this.db) await this.init();
        
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        return new Promise((resolve, reject) => {
            const getRequest = store.get(id);
            
            getRequest.onsuccess = () => {
                const item = getRequest.result;
                if (item) {
                    item.starred = !item.starred;
                    const putRequest = store.put(item);
                    
                    putRequest.onsuccess = () => {
                        resolve(item.starred);
                    };
                    
                    putRequest.onerror = () => {
                        reject(putRequest.error);
                    };
                } else {
                    reject(new Error('Item not found'));
                }
            };
            
            getRequest.onerror = () => {
                reject(getRequest.error);
            };
        });
    }

    /**
     * Delete a history item
     */
    async delete(id) {
        if (!this.db) await this.init();
        
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            
            request.onsuccess = () => {
                resolve();
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Clear all history
     */
    async clearAll() {
        if (!this.db) await this.init();
        
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        return new Promise((resolve, reject) => {
            const request = store.clear();
            
            request.onsuccess = () => {
                resolve();
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Clean up old items to maintain storage limits
     */
    async cleanup() {
        const allItems = await this.getAll();
        
        // Remove oldest items if exceeding max count
        if (allItems.length > this.maxItems) {
            const itemsToDelete = allItems
                .filter(item => !item.starred) // Don't delete starred items
                .slice(this.maxItems);
            
            for (const item of itemsToDelete) {
                await this.delete(item.id);
            }
        }
    }

    /**
     * Export history as JSON
     */
    async exportAsJSON() {
        const allItems = await this.getAll();
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            items: allItems
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-conflict-dashboard-history-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Export history as Markdown
     */
    async exportAsMarkdown() {
        const allItems = await this.getAll();
        let markdown = '# AI Conflict Dashboard History\n\n';
        markdown += `Exported on: ${new Date().toLocaleString()}\n\n`;
        
        for (const item of allItems) {
            markdown += `## ${new Date(item.timestamp).toLocaleString()}\n\n`;
            markdown += `**Prompt**: ${item.fullPrompt}\n\n`;
            
            for (const response of item.responses) {
                markdown += `### ${response.model}\n\n`;
                if (response.error) {
                    markdown += `❌ Error: ${response.error}\n\n`;
                } else {
                    markdown += `${response.response}\n\n`;
                }
            }
            
            markdown += '---\n\n';
        }
        
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-conflict-dashboard-history-${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Get storage usage statistics
     */
    async getStorageStats() {
        if (!navigator.storage || !navigator.storage.estimate) {
            return { usage: 0, quota: 0, percentage: 0 };
        }
        
        const estimate = await navigator.storage.estimate();
        return {
            usage: estimate.usage || 0,
            quota: estimate.quota || 0,
            percentage: estimate.quota ? ((estimate.usage || 0) / estimate.quota * 100) : 0
        };
    }
}

// Export for use in main script
window.HistoryManager = HistoryManager;