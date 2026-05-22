export interface FoodItem {
  id: string;
  name: string;
  createdAt: number;
}

export interface FoodStorage {
  foods: FoodItem[];
}

export interface DrawRecord {
  result: string;
  source: 'custom' | 'nearby';
  timestamp: number;
}

export type TabMode = 'custom' | 'nearby';

export const STORAGE_KEY_FOODS = 'food_list';
export const STORAGE_KEY_HISTORY = 'draw_history';

export const MAP_API_URL = 'https://apis.map.qq.com/ws/place/v1/search';
