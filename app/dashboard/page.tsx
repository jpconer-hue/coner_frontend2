
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "../Hooks/useAuthGuard";
import { clearTokens } from "../lib/auth";
import { apiClient } from "../lib/api";
import { CONFIG } from "../lib/config";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Home,
  LayoutDashboard,
  Wallet,
  Banknote,
  ShoppingBag,
  PiggyBank,
  Tags,
  LogOut,
  Plus,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

interface Expense {
  expense_id: number;
  expense_date: string;
  amount: number;
  category_id: number;
  student_id?: number;
  created_at?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { isChecking } = useAuthGuard({ requireAuth: true });

  // CRUD Data states
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states (Create & Update)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expenseDate, setExpenseDate] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [studentId, setStudentId] = useState("");

  // READ ALL (GET /expenses)
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiClient<Expense[]>(
        CONFIG.ENDPOINTS.EXPENSES,
        {
          method: "GET",
          requiresAuth: true,
        }
      );

      setExpenses(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch expenses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isChecking) {
      fetchExpenses();
    }
  }, [isChecking, fetchExpenses]);

  // READ SINGLE (GET /expenses/:id)
  const handleViewExpense = async (expenseId: number) => {
    setError("");
    setSuccess("");

    try {
      const data = await apiClient<Expense>(
        `${CONFIG.ENDPOINTS.EXPENSES}/${expenseId}`,
        {
          method: "GET",
          requiresAuth: true,
        }
      );

      setSelectedExpense(data);
    } catch (err: any) {
      setError(err.message || "Failed to load expense details.");
    }
  };

  // Open Form for CREATE
  const openCreateForm = () => {
    setEditingId(null);
    setExpenseDate("");
    setAmount("");
    setCategoryId("");
    setStudentId("");
    setSelectedExpense(null);
    setError("");
    setSuccess("");
    setIsFormOpen(true);
  };

  // Open Form for UPDATE
  const openEditForm = (expense: Expense) => {
    setEditingId(expense.expense_id);

    setExpenseDate(
      expense.expense_date
        ? expense.expense_date.split("T")[0]
        : ""
    );

    setAmount(String(expense.amount));
    setCategoryId(String(expense.category_id));
    setStudentId(String(expense.student_id ?? ""));

    setSelectedExpense(null);
    setError("");
    setSuccess("");
    setIsFormOpen(true);
  };

  // Close Form
  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setExpenseDate("");
    setAmount("");
    setCategoryId("");
    setStudentId("");
  };

  // CREATE (POST) & UPDATE (PUT)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);
    setError("");
    setSuccess("");

    if (!expenseDate || !amount || !categoryId || !studentId) {
      setError("Please complete all expense fields.");
      setSubmitting(false);
      return;
    }

    const payload = {
      expense_date: expenseDate,
      amount: Number(amount),
      student_id: Number(studentId),
      category_id: Number(categoryId),
    };

    if (
      !Number.isFinite(payload.amount) ||
      payload.amount <= 0 ||
      !Number.isInteger(payload.student_id) ||
      payload.student_id <= 0 ||
      !Number.isInteger(payload.category_id) ||
      payload.category_id <= 0
    ) {
      setError("Please enter valid amount, student ID, and category ID.");
      setSubmitting(false);
      return;
    }

    try {
      if (editingId !== null) {
        // UPDATE (PUT /expenses/:id)
        await apiClient(
          `${CONFIG.ENDPOINTS.EXPENSES}/${editingId}`,
          {
            method: "PUT",
            requiresAuth: true,
            body: JSON.stringify(payload),
          }
        );

        setSuccess(`Expense #${editingId} updated successfully.`);
      } else {
        // CREATE (POST /expenses)
        await apiClient(
          CONFIG.ENDPOINTS.EXPENSES,
          {
            method: "POST",
            requiresAuth: true,
            body: JSON.stringify(payload),
          }
        );

        setSuccess("New expense added successfully.");
      }

      closeForm();
      await fetchExpenses();
    } catch (err: any) {
      setError(err.message || "Operation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // DELETE (DELETE /expenses/:id)
  const handleDelete = async (expenseId: number) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete Expense #${expenseId}?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await apiClient(
        `${CONFIG.ENDPOINTS.EXPENSES}/${expenseId}`,
        {
          method: "DELETE",
          requiresAuth: true,
        }
      );

      if (selectedExpense?.expense_id === expenseId) {
        setSelectedExpense(null);
      }

      setSuccess(`Expense #${expenseId} deleted successfully.`);
      await fetchExpenses();
    } catch (err: any) {
      setError(err.message || "Failed to delete expense.");
    }
  };

  // LOGOUT
  const handleLogout = () => {
    clearTokens();
    router.push(CONFIG.ROUTES.LOGIN);
  };

  // TOTAL EXPENSES
  const totalExpenses = expenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  if (isChecking) {
    return <p className="p-10">Loading...</p>;
  }

  return (
    <div className="min-h-screen w-full bg-gray-100">

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-60 border-r bg-white p-6 md:flex md:flex-col">
        <h2 className="mb-2 text-lg font-bold text-green-600">
          Student Finance Tracker
        </h2>

        <p className="mb-10 text-xs text-gray-400">
          Track your money wisely
        </p>

        {/* Navigation */}
        <nav className="flex-1 space-y-3">
          <a
            href="#home"
            className="flex items-center gap-3 rounded-lg p-3 text-gray-600 hover:bg-green-50"
          >
            <Home size={19} />
            Home
          </a>

          <a
            href="#dashboard"
            className="flex items-center gap-3 rounded-lg border border-green-400 bg-green-50 p-3 font-semibold text-green-600"
          >
            <LayoutDashboard size={19} />
            Dashboard
          </a>

          <a
            href="#budget"
            className="flex items-center gap-3 rounded-lg p-3 text-gray-600 hover:bg-green-50"
          >
            <Wallet size={19} />
            My Budget
          </a>

          <a
            href="#allowance"
            className="flex items-center gap-3 rounded-lg p-3 text-gray-600 hover:bg-green-50"
          >
            <Banknote size={19} />
            Allowance
          </a>

          <a
            href="#expenses"
            className="flex items-center gap-3 rounded-lg p-3 text-gray-600 hover:bg-green-50"
          >
            <ShoppingBag size={19} />
            Expenses
          </a>

          <a
            href="#savings"
            className="flex items-center gap-3 rounded-lg p-3 text-gray-600 hover:bg-green-50"
          >
            <PiggyBank size={19} />
            Savings
          </a>

          <a
            href="#categories"
            className="flex items-center gap-3 rounded-lg p-3 text-gray-600 hover:bg-green-50"
          >
            <Tags size={19} />
            Categories
          </a>
        </nav>

        {/* Logout */}
        <div className="border-t pt-5">
          <Button
            variant="outline"
            className="w-full justify-start text-red-500 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut size={19} className="mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Dashboard */}
      <main className="p-5 md:ml-60 md:p-8">
        <div className="mx-auto max-w-6xl space-y-6">

          {/* Header */}
          <div id="home" className="flex items-center justify-between">
            <div>
              <h1
                id="dashboard"
                className="text-2xl font-bold text-gray-800"
              >
                Dashboard
              </h1>
            </div>

            {/* Mobile Logout */}
            <Button
              variant="outline"
              className="md:hidden"
              onClick={handleLogout}
            >
              <LogOut size={18} />
            </Button>
          </div>

          {/* Financial Summary */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <Card id="budget" className="border-green-200 shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold text-gray-700">
                    Total Budget
                  </p>
                  <Wallet className="text-green-500" size={24} />
                </div>

                <h2 className="text-2xl font-bold text-green-600">₱0</h2>

                <p className="mt-2 text-xs text-gray-400">
                  Your planned budget
                </p>
              </CardContent>
            </Card>

            <Card id="allowance" className="border-green-200 shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold text-gray-700">
                    Total Allowance
                  </p>
                  <Banknote className="text-blue-500" size={24} />
                </div>

                <h2 className="text-2xl font-bold text-blue-600">₱0</h2>

                <p className="mt-2 text-xs text-gray-400">
                  Your received allowance
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200 shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold text-gray-700">
                    Total Expenses
                  </p>
                  <ShoppingBag className="text-red-500" size={24} />
                </div>

                <h2 className="text-2xl font-bold text-red-500">
                  ₱{totalExpenses.toFixed(2)}
                </h2>

                <p className="mt-2 text-xs text-gray-400">
                  Your total spending
                </p>
              </CardContent>
            </Card>

            <Card id="savings" className="border-green-200 shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold text-gray-700">
                    Total Savings
                  </p>
                  <PiggyBank className="text-purple-500" size={24} />
                </div>

                <h2 className="text-2xl font-bold text-purple-600">₱0</h2>

                <p className="mt-2 text-xs text-gray-400">
                  Your saved money
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Status Notifications */}
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}

          {/* CREATE / UPDATE Form Card */}
          {isFormOpen && (
            <Card className="border-green-300 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>
                    {editingId !== null
                      ? `Update Expense #${editingId}`
                      : "Add New Expense"}
                  </CardTitle>

                  <CardDescription>
                    {editingId !== null
                      ? "Modify the expense details below."
                      : "Fill in the details to record a new expense."}
                  </CardDescription>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeForm}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">

                  {/* Four Expense Fields */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

                    <div className="space-y-2">
                      <Label htmlFor="expense_date">
                        Expense Date
                      </Label>

                      <Input
                        id="expense_date"
                        type="date"
                        value={expenseDate}
                        onChange={(e) =>
                          setExpenseDate(e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">
                        Amount (₱)
                      </Label>

                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="e.g. 250.00"
                        value={amount}
                        onChange={(e) =>
                          setAmount(e.target.value)
                        }
                        required
                      />
                    </div>

                    {/* NEW: STUDENT ID */}
                    <div className="space-y-2">
                      <Label htmlFor="student_id">
                        Student ID
                      </Label>

                      <Input
                        id="student_id"
                        type="number"
                        min="1"
                        placeholder="e.g. 5"
                        value={studentId}
                        onChange={(e) =>
                          setStudentId(e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category_id">
                        Category ID
                      </Label>

                      <Input
                        id="category_id"
                        type="number"
                        min="1"
                        placeholder="e.g. 1"
                        value={categoryId}
                        onChange={(e) =>
                          setCategoryId(e.target.value)
                        }
                        required
                      />
                    </div>
                  </div>

                  {/* Form Buttons */}
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={closeForm}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {submitting
                        ? "Saving..."
                        : editingId !== null
                        ? "Save Changes"
                        : "Add Expense"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* READ Single Expense Details Card */}
          {selectedExpense && (
            <Card className="border-green-300 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>
                    Expense Details (#{selectedExpense.expense_id})
                  </CardTitle>

                  <CardDescription>
                    Fetched directly from GET {CONFIG.ENDPOINTS.EXPENSES}/
                    {selectedExpense.expense_id}
                  </CardDescription>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedExpense(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>

              <CardContent className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">

                <div>
                  <span className="block text-gray-400">
                    Expense ID
                  </span>

                  <span className="font-semibold">
                    {selectedExpense.expense_id}
                  </span>
                </div>

                <div>
                  <span className="block text-gray-400">
                    Date
                  </span>

                  <span className="font-semibold">
                    {selectedExpense.expense_date?.split("T")[0] || "N/A"}
                  </span>
                </div>

                <div>
                  <span className="block text-gray-400">
                    Amount
                  </span>

                  <span className="font-semibold text-red-500">
                    ₱{Number(selectedExpense.amount).toFixed(2)}
                  </span>
                </div>

                <div>
                  <span className="block text-gray-400">
                    Category ID
                  </span>

                  <span className="font-semibold">
                    {selectedExpense.category_id}
                  </span>
                </div>

              </CardContent>
            </Card>
          )}

          {/* Recent Expenses CRUD Table */}
          <Card id="expenses" className="border-green-200 shadow-sm">

            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Recent Expenses</CardTitle>

                <p className="text-sm text-gray-400">
                  Manage your spending activities (GET, POST, PUT, DELETE).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={fetchExpenses}
                  disabled={loading}
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${
                      loading ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </Button>

                <Button
                  onClick={openCreateForm}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Expense
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">

                <table className="w-full text-left text-sm">

                  <thead className="border-b text-gray-500">
                    <tr>
                      <th className="p-3">ID</th>
                      <th className="p-3">Category ID</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-6 text-center text-gray-400"
                        >
                          Loading expenses...
                        </td>
                      </tr>
                    ) : expenses.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-6 text-center text-gray-400"
                        >
                          No expenses found. Click "Add Expense" to create one.
                        </td>
                      </tr>
                    ) : (
                      expenses.map((expense) => (
                        <tr
                          key={expense.expense_id}
                          className="border-b"
                        >
                          <td className="p-3 font-medium">
                            {expense.expense_id}
                          </td>

                          <td className="p-3">
                            {expense.category_id}
                          </td>

                          <td className="p-3">
                            {expense.expense_date?.split("T")[0] || "-"}
                          </td>

                          <td className="p-3 font-semibold text-red-500">
                            -₱{Number(expense.amount).toFixed(2)}
                          </td>

                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-2">

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleViewExpense(expense.expense_id)
                                }
                              >
                                <Eye className="mr-1 h-4 w-4" />
                                Read
                              </Button>

                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => openEditForm(expense)}
                              >
                                <Pencil className="mr-1 h-4 w-4" />
                                Update
                              </Button>

                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  handleDelete(expense.expense_id)
                                }
                              >
                                <Trash2 className="mr-1 h-4 w-4" />
                                Delete
                              </Button>

                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>

                </table>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
