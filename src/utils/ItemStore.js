import itemsData from '../data/items.json';

// Full item list, available synchronously
export const ALL_ITEMS = itemsData;

// Search by name, returns up to `limit` results
export function searchItems(query, limit = 30, customItems = []) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  const allItems = [...ALL_ITEMS, ...customItems];
  return allItems.filter(item =>
    item.Name.toLowerCase().includes(q)
  ).slice(0, limit);
}

// Look up a single item by exact name
export function getItemByName(name, customItems = []) {
  const allItems = [...ALL_ITEMS, ...customItems];
  const result = allItems.find(item => item.Name === name) ?? null;
  return result;
}
