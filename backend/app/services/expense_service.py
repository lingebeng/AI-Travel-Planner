"""
Expense service for AI Travel Planner
Handles CRUD operations for expense tracking
"""

from datetime import date
from typing import Any, Dict, List, Optional

from supabase import Client, create_client

from app.config import Config


class ExpenseService:
    """Service for managing travel expenses"""

    def __init__(self):
        """Initialize expense service with Supabase client"""
        self.supabase: Client = create_client(
            Config.SUPABASE_URL, Config.SUPABASE_SERVICE_KEY
        )

    def create_expense(
        self,
        user_id: str,
        itinerary_id: str,
        category: str,
        amount: float,
        description: Optional[str] = None,
        expense_date: Optional[Any] = None,  # Can be str or date object
        location: Optional[str] = None,
        payment_method: Optional[str] = None,
        voice_input: bool = False,
    ) -> Dict[str, Any]:
        """
        Create a new expense record

        Args:
            user_id: User ID from auth.users
            itinerary_id: Associated itinerary ID
            category: Expense category (交通/住宿/餐饮/景点/购物/其他)
            amount: Expense amount
            description: Optional description
            expense_date: Date of expense (defaults to today)
            location: Optional location where expense occurred
            payment_method: Optional payment method (现金/微信/支付宝/银行卡)
            voice_input: Whether this was input via voice

        Returns:
            Created expense record

        Raises:
            ValueError: If category is invalid or amount is negative
        """
        # Validate category
        valid_categories = ["交通", "住宿", "餐饮", "景点", "购物", "其他"]
        if category not in valid_categories:
            raise ValueError(
                f"Invalid category '{category}'. Must be one of: {', '.join(valid_categories)}"
            )

        # Validate amount
        if amount < 0:
            raise ValueError("Amount must be non-negative")

        # Prepare expense data
        expense_data = {
            "user_id": user_id,
            "itinerary_id": itinerary_id,
            "category": category,
            "amount": amount,
            "voice_input": voice_input,
        }

        # Add optional fields
        if description:
            expense_data["description"] = description
        if expense_date:
            # expense_date can be either a string or a date object
            if isinstance(expense_date, str):
                expense_data["expense_date"] = expense_date
            else:
                expense_data["expense_date"] = expense_date.isoformat()
        else:
            expense_data["expense_date"] = date.today().isoformat()
        if location:
            expense_data["location"] = location
        if payment_method:
            expense_data["payment_method"] = payment_method

        # Insert into database
        response = self.supabase.table("expenses").insert(expense_data).execute()

        if not response.data or len(response.data) == 0:
            raise Exception("Failed to create expense")

        return response.data[0]

    def get_expenses(
        self,
        user_id: str,
        itinerary_id: Optional[str] = None,
        category: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[Dict[str, Any]]:
        """
        Get expenses with optional filters

        Args:
            user_id: User ID to filter by
            itinerary_id: Optional itinerary ID filter
            category: Optional category filter
            start_date: Optional start date filter
            end_date: Optional end date filter

        Returns:
            List of expense records
        """
        query = self.supabase.table("expenses").select("*").eq("user_id", user_id)

        if itinerary_id:
            query = query.eq("itinerary_id", itinerary_id)
        if category:
            query = query.eq("category", category)
        if start_date:
            query = query.gte("expense_date", start_date.isoformat())
        if end_date:
            query = query.lte("expense_date", end_date.isoformat())

        # Order by expense date descending
        query = query.order("expense_date", desc=True)

        response = query.execute()
        return response.data if response.data else []

    def get_expense_by_id(
        self, expense_id: str, user_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get a single expense by ID

        Args:
            expense_id: Expense ID
            user_id: User ID (for authorization)

        Returns:
            Expense record or None if not found
        """
        response = (
            self.supabase.table("expenses")
            .select("*")
            .eq("id", expense_id)
            .eq("user_id", user_id)
            .execute()
        )

        if response.data and len(response.data) > 0:
            return response.data[0]
        return None

    def update_expense(
        self,
        expense_id: str,
        user_id: str,
        updates: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Update an expense record

        Args:
            expense_id: Expense ID to update
            user_id: User ID (for authorization)
            updates: Dictionary of fields to update

        Returns:
            Updated expense record

        Raises:
            ValueError: If expense not found or unauthorized
        """
        # Validate expense exists and belongs to user
        expense = self.get_expense_by_id(expense_id, user_id)
        if not expense:
            raise ValueError("Expense not found or unauthorized")

        # Validate category if being updated
        if "category" in updates:
            valid_categories = ["交通", "住宿", "餐饮", "景点", "购物", "其他"]
            if updates["category"] not in valid_categories:
                raise ValueError("Invalid category")

        # Validate amount if being updated
        if "amount" in updates and updates["amount"] < 0:
            raise ValueError("Amount must be non-negative")

        # Update in database
        response = (
            self.supabase.table("expenses")
            .update(updates)
            .eq("id", expense_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not response.data or len(response.data) == 0:
            raise Exception("Failed to update expense")

        return response.data[0]

    def delete_expense(self, expense_id: str, user_id: str) -> bool:
        """
        Delete an expense record

        Args:
            expense_id: Expense ID to delete
            user_id: User ID (for authorization)

        Returns:
            True if deleted successfully

        Raises:
            ValueError: If expense not found or unauthorized
        """
        # Validate expense exists and belongs to user
        expense = self.get_expense_by_id(expense_id, user_id)
        if not expense:
            raise ValueError("Expense not found or unauthorized")

        # Delete from database
        self.supabase.table("expenses").delete().eq("id", expense_id).eq(
            "user_id", user_id
        ).execute()

        return True

    def get_expense_statistics(self, user_id: str, itinerary_id: str) -> Dict[str, Any]:
        """
        Get expense statistics for an itinerary

        Args:
            user_id: User ID
            itinerary_id: Itinerary ID

        Returns:
            Dictionary with expense statistics:
            - total_spent: Total amount spent
            - by_category: Breakdown by category
            - expense_count: Number of expenses
            - avg_expense: Average expense amount
        """
        expenses = self.get_expenses(user_id, itinerary_id)

        if not expenses:
            return {
                "total_spent": 0,
                "by_category": {},
                "expense_count": 0,
                "avg_expense": 0,
            }

        total_spent = sum(float(exp["amount"]) for exp in expenses)
        expense_count = len(expenses)

        # Group by category
        by_category = {}
        for exp in expenses:
            category = exp["category"]
            if category not in by_category:
                by_category[category] = 0
            by_category[category] += float(exp["amount"])

        return {
            "total_spent": total_spent,
            "by_category": by_category,
            "expense_count": expense_count,
            "avg_expense": total_spent / expense_count if expense_count > 0 else 0,
        }

    def get_budget_comparison(
        self, user_id: str, itinerary_id: str, budget_breakdown: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Compare actual expenses with budget

        Args:
            user_id: User ID
            itinerary_id: Itinerary ID
            budget_breakdown: Budget breakdown by category

        Returns:
            Dictionary comparing budget vs actual for each category
        """
        stats = self.get_expense_statistics(user_id, itinerary_id)
        actual_by_category = stats["by_category"]

        # Map category names
        category_map = {
            "交通": "transportation",
            "住宿": "accommodation",
            "餐饮": "food",
            "景点": "attractions",
            "购物": "shopping",
            "其他": "other",
        }

        comparison = {}
        for cn_category, en_category in category_map.items():
            budget = budget_breakdown.get(en_category, 0)
            actual = actual_by_category.get(cn_category, 0)
            difference = actual - budget
            percentage = (actual / budget * 100) if budget > 0 else 0

            comparison[cn_category] = {
                "budget": budget,
                "actual": actual,
                "difference": difference,
                "percentage": percentage,
                "status": "over"
                if difference > 0
                else ("under" if difference < 0 else "exact"),
            }

        # Add totals
        total_budget = sum(budget_breakdown.values())
        total_actual = stats["total_spent"]
        comparison["总计"] = {
            "budget": total_budget,
            "actual": total_actual,
            "difference": total_actual - total_budget,
            "percentage": (total_actual / total_budget * 100)
            if total_budget > 0
            else 0,
            "status": (
                "over"
                if total_actual > total_budget
                else ("under" if total_actual < total_budget else "exact")
            ),
        }

        return comparison


# Singleton instance
expense_service = ExpenseService()
