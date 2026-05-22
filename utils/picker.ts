import type { FoodItem } from '../types/index';

export function pickFromCustom(foods: FoodItem[]): string {
  const idx = Math.floor(Math.random() * foods.length);
  return foods[idx].name;
}

export function pickFromList(list: string[]): string {
  const idx = Math.floor(Math.random() * list.length);
  return list[idx];
}
