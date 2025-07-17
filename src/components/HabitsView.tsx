import React, { useState } from 'react';
import { Plus, Filter, Search } from 'lucide-react';
import { HabitCard } from './HabitCard';
import { AddHabitModal } from './AddHabitModal';
import { ConfirmationModal } from './ConfirmationModal'; // Add this import
import { Habit } from '../types/habit';
import { getAllCategories } from '../utils/categoryUtils';

interface HabitsViewProps {
  habits: Habit[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onAddHabit: (habit: Omit<Habit, 'id' | 'completions' | 'currentStreak' | 'bestStreak' | 'createdDate'> & { color: string; selectedDays: string[] }) => void;
  onUpdateHabit: (id: string, updates: Partial<Habit>) => void;
  onDeleteHabit: (id: string) => void;
  onToggleCompletion: (id: string) => void;
}

export const HabitsView: React.FC<HabitsViewProps> = ({
  habits,
  selectedCategory,
  onCategoryChange,
  onAddHabit,
  onUpdateHabit,
  onDeleteHabit,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Add confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    habitId: string | null;
    habitName: string;
  }>({
    isOpen: false,
    habitId: null,
    habitName: ''
  });
  
  const categories = getAllCategories();

  const filteredHabits = habits
    .filter(habit => selectedCategory === 'all' || habit.category === selectedCategory)
    .filter(habit => habit.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .map(habit => ({
      ...habit,
      isCompletedToday: habit.completions.includes(new Date().toISOString().split('T')[0])
    }));

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHabit(null);
  };

  // Updated handleDeleteHabit to use custom modal
  const handleDeleteHabit = (id: string) => {
    const habit = habits.find(h => h.id === id);
    if (habit) {
      setConfirmationModal({
        isOpen: true,
        habitId: id,
        habitName: habit.name
      });
    }
  };

  // Handle confirmation modal actions
  const handleConfirmDelete = () => {
    if (confirmationModal.habitId) {
      onDeleteHabit(confirmationModal.habitId);
    }
    setConfirmationModal({
      isOpen: false,
      habitId: null,
      habitName: ''
    });
  };

  const handleCancelDelete = () => {
    setConfirmationModal({
      isOpen: false,
      habitId: null,
      habitName: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Habits</h1>
          <p className="text-gray-600">Manage and track your daily habits</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Habit
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search habits..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="pl-11 pr-8 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white min-w-48"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Habits Grid */}
      {filteredHabits.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {searchTerm || selectedCategory !== 'all' ? 'No habits found' : 'No habits yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Start building better habits by adding your first one!'
            }
          </p>
          {!searchTerm && selectedCategory === 'all' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Your First Habit
            </button>
          )}
        </div>
      ) : (
        <div className="habits-grid">
          {filteredHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onEdit={handleEditHabit}
              onDelete={handleDeleteHabit}
              showActions={true}
              showCompletion={false}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AddHabitModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAdd={onAddHabit}
        onUpdate={onUpdateHabit}
        editingHabit={editingHabit}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Habit"
        message={`Are you sure you want to delete "${confirmationModal.habitName}"? This will permanently remove all completion data and cannot be undone.`}
        confirmText="Delete Habit"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};