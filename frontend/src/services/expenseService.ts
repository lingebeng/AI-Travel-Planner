/**
 * Expense Service - API client for expense management
 */

import apiClient from './api';

export interface Expense {
  id: string;
  itinerary_id: string;
  user_id: string;
  category: string;
  amount: number;
  description?: string;
  expense_date: string;
  location?: string;
  payment_method?: string;
  voice_input: boolean;
  created_at: string;
}

export interface ExpenseInput {
  itinerary_id: string;
  category: string;
  amount: number;
  description?: string;
  expense_date?: string;
  location?: string;
  payment_method?: string;
  voice_input?: boolean;
}

export interface ExpenseStats {
  total_spent: number;
  by_category: Record<string, number>;
  expense_count: number;
  avg_expense: number;
}

export interface VoiceParseResult {
  category: string;
  amount: number;
  description?: string;
  location?: string;
  payment_method?: string;
  confidence: number;
}

export interface BudgetAnalysis {
  overspending_alert: {
    has_overspending: boolean;
    categories: Array<{
      category: string;
      budget: number;
      actual: number;
      overspent: number;
      percentage: number;
    }>;
    message: string;
  };
  saving_suggestions: Array<{
    suggestion: string;
    category: string;
    estimated_saving: number;
  }>;
  optimized_budget: Record<string, number> & {
    rationale: string;
  };
  trend_prediction: {
    predicted_total: number;
    predicted_overspending: number;
    warning_level: 'low' | 'medium' | 'high';
    message: string;
  };
}

class ExpenseService {
  /**
   * Add a new expense
   */
  async addExpense(expense: ExpenseInput): Promise<Expense> {
    const response = await apiClient.post('/expenses/add', expense);
    if (!response.success) {
      throw new Error(response.error || 'Failed to add expense');
    }
    return response.data;
  }

  /**
   * Get expenses with optional filters
   */
  async getExpenses(params?: {
    itinerary_id?: string;
    category?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<Expense[]> {
    const response = await apiClient.get('/expenses/list', { params });
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch expenses');
    }
    return response.data;
  }

  /**
   * Get a single expense by ID
   */
  async getExpense(expenseId: string): Promise<Expense> {
    const response = await apiClient.get(`/expenses/${expenseId}`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch expense');
    }
    return response.data;
  }

  /**
   * Update an expense
   */
  async updateExpense(
    expenseId: string,
    updates: Partial<ExpenseInput>
  ): Promise<Expense> {
    const response = await apiClient.put(`/expenses/${expenseId}`, updates);
    if (!response.success) {
      throw new Error(response.error || 'Failed to update expense');
    }
    return response.data;
  }

  /**
   * Delete an expense
   */
  async deleteExpense(expenseId: string): Promise<void> {
    const response = await apiClient.delete(`/expenses/${expenseId}`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete expense');
    }
  }

  /**
   * Get expense statistics for an itinerary
   */
  async getStats(itineraryId: string): Promise<ExpenseStats> {
    const response = await apiClient.get('/expenses/stats', {
      params: { itinerary_id: itineraryId },
    });
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch stats');
    }
    return response.data;
  }

  /**
   * Parse voice text into structured expense data
   */
  async parseVoiceExpense(text: string): Promise<VoiceParseResult> {
    const response = await apiClient.post('/expenses/voice-parse', { text });
    if (!response.success) {
      throw new Error(response.error || 'Failed to parse voice expense');
    }
    return response.data;
  }

  /**
   * Get AI budget analysis
   */
  async analyzeBudget(itineraryId: string): Promise<BudgetAnalysis> {
    const response = await apiClient.post('/expenses/ai-analysis', {
      itinerary_id: itineraryId,
    });
    if (!response.success) {
      throw new Error(response.error || 'Failed to analyze budget');
    }
    return response.data;
  }
}

export const expenseService = new ExpenseService();
