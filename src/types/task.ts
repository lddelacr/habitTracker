export interface Task {
  id: string;
  name: string;
  description: string;
  category: string;
  color: string;
  customColor?: string | null;
  dueDate: string; // YYYY-MM-DD format
  dueTime: string; // HH:MM format (24-hour)
  status: 'pending' | 'completed' | 'overdue';
  createdDate: string;
}

export interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  pendingTasks: number;
  completionRate: number;
  tasksByCategory: Record<string, number>;
}

export const TASK_STATUSES = [
  { value: 'pending', label: 'Pending', color: '#6b7280' },
  { value: 'completed', label: 'Completed', color: '#10b981' },
  { value: 'overdue', label: 'Overdue', color: '#ef4444' }
] as const;