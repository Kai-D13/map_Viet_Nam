/**
 * Storage Manager for Logistics Data
 * Uses IndexedDB to cache uploaded Excel data
 */

const DB_NAME = 'LogisticsDB';
const DB_VERSION = 1;
const STORE_NAME = 'datasets';

/**
 * Initialize IndexedDB
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('uploadDate', 'uploadDate', { unique: false });
        objectStore.createIndex('fileName', 'fileName', { unique: false });
      }
    };
  });
}

/**
 * Save dataset to IndexedDB
 * @param {string} fileName - Name of the uploaded file
 * @param {Array} data - Parsed data array
 * @returns {Promise<string>} - Dataset ID
 */
export async function saveDataset(fileName, data) {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const dataset = {
      id: `dataset_${Date.now()}`,
      fileName: fileName,
      uploadDate: new Date().toISOString(),
      rowCount: data.length,
      data: data
    };

    return new Promise((resolve, reject) => {
      const request = store.add(dataset);
      request.onsuccess = () => resolve(dataset.id);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error saving dataset:', error);
    throw error;
  }
}

/**
 * Get all saved datasets (metadata only, no data)
 * @returns {Promise<Array>} - Array of dataset metadata
 */
export async function getAllDatasets() {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAllKeys();
      request.onsuccess = async () => {
        const keys = request.result;
        const datasets = [];

        for (const key of keys) {
          const getRequest = store.get(key);
          await new Promise((res) => {
            getRequest.onsuccess = () => {
              const dataset = getRequest.result;
              datasets.push({
                id: dataset.id,
                fileName: dataset.fileName,
                uploadDate: dataset.uploadDate,
                rowCount: dataset.rowCount
              });
              res();
            };
          });
        }

        resolve(datasets);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting datasets:', error);
    return [];
  }
}

/**
 * Get dataset by ID
 * @param {string} id - Dataset ID
 * @returns {Promise<Object>} - Dataset object with data
 */
export async function getDataset(id) {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting dataset:', error);
    throw error;
  }
}

/**
 * Delete dataset by ID
 * @param {string} id - Dataset ID
 * @returns {Promise<void>}
 */
export async function deleteDataset(id) {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error deleting dataset:', error);
    throw error;
  }
}

/**
 * Clear all datasets
 * @returns {Promise<void>}
 */
export async function clearAllDatasets() {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error clearing datasets:', error);
    throw error;
  }
}

