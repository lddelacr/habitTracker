export interface Task {
  id: string;
  name: string;
  description: string;
  category: string;
  color: string;
  customColor?: string | null;
  
  // NEW: Type field to distinguish tasks vs events
  type: 'task' | 'event';
  
  dueDate: string; // YYYY-MM-DD format
  dueTime: string; // HH:MM format (24-hour)
  
  // NEW: Event-specific fields
  endTime?: string; // HH:MM format (24-hour) - for events with duration
  location?: string; // For event location
  attendees?: string[]; // For event attendees
  
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

// NEW: Helper function to check if item is all-day
export const isAllDay = (task: Task): boolean => {
  return task.dueTime === '00:00';
};

// NEW: Helper function to format event time range
export const formatEventTimeRange = (task: Task): string => {
  if (isAllDay(task)) {
    return 'All day';
  }
  
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const period = hours < 12 ? 'AM' : 'PM';
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };
  
  const startTime = formatTime(task.dueTime);
  
  if (task.type === 'event' && task.endTime && task.endTime !== task.dueTime) {
    const endTime = formatTime(task.endTime);
    return `${startTime} - ${endTime}`;
  }
  
  return startTime;
};