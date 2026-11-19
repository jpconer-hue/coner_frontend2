
"use client";

import { useEffect, useState } from "react";

import { useAuthGuard } from "../Hooks/useAuthGuard";
import { apiClient } from "../lib/api";
import { getUserId } from "../lib/auth";
import { CONFIG } from "../lib/config";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Expense {
  expense_id: number;
  expense_date: string;
  amount: string;
  student_id: number;
  category_id: number;
}

export default function ExpensesPage() {
  useAuthGuard({ requireAuth: true });

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseDate, setExpenseDate] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  // GET ALL EXPENSES
  const fetchExpenses = async () => {
    try {
      const data = await apiClient<Expense[]>(
        CONFIG.ENDPOINTS.EXPENSES,
        {
          method: "GET",
          requiresAuth: true,
        }
      );

      setExpenses(data);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to load expenses."
      );
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // CLEAR FORM
  const clearForm = () => {
    setExpenseDate("");
    setAmount("");
    setCategoryId("");
    setSelectedId(null);
  };

  // GET ONE EXPENSE
  const handleViewExpense = async (id: number) => {
    try {
      const data = await apiClient<Expense>(
        `${CONFIG.ENDPOINTS.EXPENSES}/${id}`,
        {
          method: "GET",
          requiresAuth: true,
        }
      );

      setExpenseDate(data.expense_date?.split("T")[0] || "");
      setAmount(String(data.amount));
      setCategoryId(String(data.category_id));
      setSelectedId(data.expense_id);
      setMessage("Expense loaded successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to load expense."
      );
    }
  };

  // CREATE AND UPDATE EXPENSE
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const studentId = Number(getUserId());

    if (!studentId || !expenseDate || !amount || !categoryId) {
      setMessage("Please complete all fields and check your student ID.");
      return;
    }

    const expenseData = {
      expense_date: expenseDate,
      amount: amount,
      student_id: studentId,
      category_id: Number(categoryId),
    };

    try {
      if (selectedId !== null) {
        // UPDATE
        await apiClient(
          `${CONFIG.ENDPOINTS.EXPENSES}/${selectedId}`,
          {
            method: "PUT",
            requiresAuth: true,
            body: JSON.stringify(expenseData),
          }
        );

        setMessage("Expense updated successfully.");
      } else {
        // CREATE
        await apiClient(
          CONFIG.ENDPOINTS.EXPENSES,
          {
            method: "POST",
            requiresAuth: true,
            body: JSON.stringify(expenseData),
          }
        );

        setMessage("Expense added successfully.");
      }

      clearForm();
      fetchExpenses();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Operation failed."
      );
    }
  };

  // DELETE EXPENSE
  const handleDeleteExpense = async (id: number) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!confirmDelete) return;

    try {
      await apiClient(
        `${CONFIG.ENDPOINTS.EXPENSES}/${id}`,
        {
          method: "DELETE",
          requiresAuth: true,
        }
      );

      setMessage("Expense deleted successfully.");

      if (selectedId === id) {
        clearForm();
      }

      fetchExpenses();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to delete expense."
      );
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Expenses</h1>
        <p className="text-muted-foreground">
          Manage your expenses using CRUD operations.
        </p>
      </div>

      {message && (
        <p className="text-sm text-blue-600">{message}</p>
      )}

      {/* EXPENSE FORM */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedId !== null ? "Update Expense" : "Add New Expense"}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expense_date">Expense Date</Label>
              <Input
                id="expense_date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category_id">Category ID</Label>
              <Input
                id="category_id"
                type="number"
                min="1"
                placeholder="Enter category ID"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit">
                {selectedId !== null ? "Update Expense" : "Add Expense"}
              </Button>

              {selectedId !== null && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearForm}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* EXPENSE TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Records</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Expense ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Category ID</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {expenses.length > 0 ? (
                  expenses.map((expense) => (
                    <TableRow key={expense.expense_id}>
                      <TableCell>{expense.expense_id}</TableCell>
                      <TableCell>
                        {expense.expense_date?.split("T")[0]}
                      </TableCell>
                      <TableCell>
                        ₱{Number(expense.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>{expense.student_id}</TableCell>
                      <TableCell>{expense.category_id}</TableCell>

                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleViewExpense(expense.expense_id)
                            }
                          >
                            View / Edit
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handleDeleteExpense(expense.expense_id)
                            }
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No expense records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
