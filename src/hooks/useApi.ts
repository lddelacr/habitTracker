import { useAuth } from '../contexts/AuthContext';
import { Habit } from '../types/habit';

export const useApi = () => {
  const { session, signOut } = useAuth();
  const API_BASE_URL = 'http://localhost:3001/api';

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        // Token expired or invalid
        signOut();
        throw new Error('Session expired. Please log in again.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  };

  const fetchHabits = async (): Promise<Habit[]> => {
    const data = await apiCall('/habits');
    return data.habits;
  };

  const createHabit = async (habitData: Omit<Habit, 'id' | 'completions' | 'currentStreak' | 'bestStreak' | 'createdDate'> & { color: string }): Promise<Habit> => {
    const data = await apiCall('/habits', {
      method: 'POST',
      body: JSON.stringify({
        ...habitData,
        createdDate: new Date().toISOString().split('T')[0]
      }),
    });
    return data.habit;
  };

  const updateHabit = async (id: string, updates: Partial<Habit>): Promise<void> => {
    await apiCall(`/habits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  };

  const deleteHabit = async (id: string): Promise<void> => {
    await apiCall(`/habits/${id}`, {
      method: 'DELETE',
    });
  };

  const addCompletion = async (habitId: string, completionDate: string): Promise<void> => {
    await apiCall('/completions', {
      method: 'POST',
      body: JSON.stringify({ habitId, completionDate }),
    });
  };

  const removeCompletion = async (habitId: string, completionDate: string): Promise<void> => {
    await apiCall('/completions', {
      method: 'DELETE',
      body: JSON.stringify({ habitId, completionDate }),
    });
  };

  return {
    fetchHabits,
    createHabit,
    updateHabit,
    deleteHabit,
    addCompletion,
    removeCompletion,
  };
};