export interface Habit {
  id: string;
  name: string;
  category: string; // Now uses category ID
  description: string;
  createdDate: string;
  completions: string[]; // Array of completion dates in YYYY-MM-DD format
  currentStreak: number;
  bestStreak: number;
  selectedDays: string[]; // Array of selected days: ['monday', 'tuesday', etc.]
  color: string; // Unique color for calendar visualization
  customColor?: string | null; // Custom color override, null if using category color
}

export interface HabitNote {
  habitId: string;
  date: string;
  note: string;
  timestamp: string;
}

export interface DailyThoughts {
  date: string;
  thoughts: string;
  timestamp: string;
}

export interface HabitStats {
  totalHabits: number;
  totalCompletions: number;
  averageCompletionRate: number;
  longestStreak: number;
  currentActiveStreaks: number;
}

// Research-based habit categories with intuitive default colors
export interface HabitCategory {
  id: string;
  name: string;
  color: string;
  description: string;
}

export const DEFAULT_CATEGORIES: HabitCategory[] = [
  {
    id: 'health',
    name: 'Health',
    color: '#93D8E9', // Light blue - calm, wellness, vitality
    description: 'Exercise, sleep, water, nutrition, meditation, medications'
  },
  {
    id: 'work',
    name: 'Work',
    color: '#DF998E', // Coral/salmon - professional warmth, productivity
    description: 'Deep work, meetings, skills, projects, networking'
  },
  {
    id: 'learning',
    name: 'Learning',
    color: '#9C9BE7', // Light purple - knowledge, creativity, growth
    description: 'Reading, courses, practice, creative projects, hobbies'
  },
  {
    id: 'social',
    name: 'Social',
    color: '#DBABBE', // Light pink - connection, relationships, warmth
    description: 'Friends, family, calls, dates, community activities'
  },
  {
    id: 'finance',
    name: 'Finance',
    color: '#B7E197', // Light green - growth, prosperity, balance
    description: 'Budgeting, saving, investing, expense tracking'
  },
  {
    id: 'personal',
    name: 'Personal',
    color: '#FFE1A8', // Light yellow - personal growth, self-care, positivity
    description: 'Routines, chores, self-care, organization, breaking bad habits'
  }
];

// Legacy category names for migration
export const HABIT_CATEGORIES = DEFAULT_CATEGORIES.map(cat => cat.name);
// Predefined color palette for habits
export const HABIT_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Light Yellow
  '#BB8FCE', // Light Purple
  '#85C1E9', // Light Blue
  '#F8C471', // Orange
  '#82E0AA', // Light Green
] as const;