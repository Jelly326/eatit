import type { FoodItem, FoodStorage, DrawRecord } from '../types/index';
import { STORAGE_KEY_FOODS, STORAGE_KEY_HISTORY } from '../types/index';

export function getFoods(): FoodItem[] {
  try {
    const data = wx.getStorageSync(STORAGE_KEY_FOODS) as FoodStorage | '';
    if (data && data.foods) return data.foods;
  } catch (_) { /* ignore */ }
  return [];
}

export function saveFoods(foods: FoodItem[]): void {
  const data: FoodStorage = { foods };
  wx.setStorageSync(STORAGE_KEY_FOODS, data);
}

export function addFood(name: string): FoodItem[] {
  const foods = getFoods();
  const trimmed = name.trim();
  if (!trimmed) return foods;
  if (foods.some(f => f.name === trimmed)) return foods;
  const item: FoodItem = {
    id: Date.now().toString(36),
    name: trimmed,
    createdAt: Date.now(),
  };
  foods.push(item);
  saveFoods(foods);
  return foods;
}

export function removeFood(id: string): FoodItem[] {
  const foods = getFoods().filter(f => f.id !== id);
  saveFoods(foods);
  return foods;
}

export function getDrawHistory(): DrawRecord | null {
  try {
    return wx.getStorageSync(STORAGE_KEY_HISTORY) as DrawRecord | null;
  } catch (_) { return null; }
}

export function saveDrawHistory(record: DrawRecord): void {
  wx.setStorageSync(STORAGE_KEY_HISTORY, record);
}
