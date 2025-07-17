import { DEFAULT_CATEGORIES, HabitCategory } from '../types/habit';

// Category management functions
export const getCategoryColor = (categoryId: string): string => {
  const customColors = JSON.parse(localStorage.getItem('categoryColors') || '{}');
  const defaultCategory = DEFAULT_CATEGORIES.find(c => c.id === categoryId);
  
  return customColors[categoryId] || defaultCategory?.color || '#6b7280';
};

export const setCategoryColor = (categoryId: string, color: string): void => {
  const customColors = JSON.parse(localStorage.getItem('categoryColors') || '{}');
  customColors[categoryId] = color;
  localStorage.setItem('categoryColors', JSON.stringify(customColors));
};

export const getCategoryById = (categoryId: string): HabitCategory | undefined => {
  return DEFAULT_CATEGORIES.find(c => c.id === categoryId);
};

export const getCategoryByName = (categoryName: string): HabitCategory | undefined => {
  return DEFAULT_CATEGORIES.find(c => c.name === categoryName);
};

export const getAllCategories = (): HabitCategory[] => {
  const customColors = JSON.parse(localStorage.getItem('categoryColors') || '{}');
  
  return DEFAULT_CATEGORIES.map(category => ({
    ...category,
    color: customColors[category.id] || category.color
  }));
};

export const resetCategoryColors = (): void => {
  localStorage.removeItem('categoryColors');
};

// Migration helper for existing habits
export const migrateCategoryName = (oldCategoryName: string): string => {
  const categoryMapping: Record<string, string> = {
    // Legacy category names to new system (consolidated)
    'Health & Fitness': 'health',
    'health-fitness': 'health',
    'Productivity': 'work',
    'productivity': 'work',
    'Productivity & Work': 'work',
    'Learning': 'learning',
    'Learning & Growth': 'learning',
    'Social': 'social',
    'Social & Relationships': 'social',
    'Finance': 'finance',
    'Finance & Money': 'finance',
    'Self-Care': 'personal',
    'self-care': 'personal',
    'Self-Care & Wellness': 'personal',
    'Personal Care': 'personal',
    'Creative': 'personal',
    'creative': 'personal',
    'Creative & Hobbies': 'personal',
    'Mindfulness': 'personal',
    'mindfulness': 'personal',
    'Mindfulness & Spirituality': 'personal',
    'Home': 'personal',
    'home': 'personal',
    'Home & Lifestyle': 'personal',
    'Other': 'personal'
  };
  
  return categoryMapping[oldCategoryName] || 'personal';
};

// Get habit color (custom or category)
export const getHabitColor = (habit: { category: string; customColor?: string | null; color?: string }): string => {
  return habit.customColor || getCategoryColor(habit.category);
};

// Force update existing habits/tasks to use new default colors
export const updateExistingItemsWithNewColors = (): void => {
  // This function can be called to update localStorage or trigger a refresh
  // The actual update logic will be handled by the hooks when they detect color changes
  window.dispatchEvent(new CustomEvent('categoryColorsUpdated'));
};