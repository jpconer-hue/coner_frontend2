
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "../Hooks/useAuthGuard";
import { clearTokens } from "../lib/auth";
import { apiClient } from "../lib/api";
import { CONFIG } from "../lib/config";

import { Button } from "@/components/ui/button";
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
  Menu,
} from "lucide-react";

// ==========================================
// TYPES
// ==========================================

type PageKey =
  | "home"
  | "dashboard"
  | "budget"
  | "allowance"
  | "expenses"
  | "savings"
  | "categories";

type RowData = Record<string, any>;

type Field = {
  name: string;
  label: string;
  type: "text" | "number" | "date";
  required?: boolean;
};

type Resource = {
  key: Exclude<PageKey, "home" | "dashboard">;
  title: string;
  description: string;
  idField: string;
  endpoint: string;
  fields: Field[];
};

const RESOURCES: Resource[] = [
  {
    key: "budget",
    title: "My Budget",
    description: "Plan and manage your money.",
    idField: "budget_id",
    endpoint: "BUDGETS",
    fields: [
      { name: "budget_period", label: "Budget Period", type: "text" },
      { name: "budget_amount", label: "Budget Amount (₱)", type: "number" },
      { name: "student_id", label: "Student ID", type: "number" },
    ],
  },
  {
    key: "allowance",
    title: "Allowance",
    description: "Keep track of the money you receive.",
    idField: "allowance_id",
    endpoint: "ALLOWANCES",
    fields: [
      { name: "allowance_date", label: "Allowance Date", type: "date" },
      { name: "allowance_amount", label: "Allowance Amount (₱)", type: "number" },
      { name: "student_id", label: "Student ID", type: "number" },
    ],
  },
  {
    key: "expenses",
    title: "Expenses",
    description: "Manage your daily spending activities.",
    idField: "expense_id",
    endpoint: "EXPENSES",
    fields: [
      { name: "expense_date", label: "Expense Date", type: "date" },
      { name: "amount", label: "Amount (₱)", type: "number" },
      { name: "student_id", label: "Student ID", type: "number" },
      { name: "category_id", label: "Category ID", type: "number" },
    ],
  },
  {
    key: "savings",
    title: "Savings",
    description: "Monitor your savings and financial goals.",
    idField: "savings_id",
    endpoint: "SAVINGS",
    fields: [
      { name: "savings_date", label: "Savings Date", type: "date" },
      { name: "amount_saved", label: "Amount Saved (₱)", type: "number" },
      { name: "savings_goal", label: "Savings Goal (₱)", type: "number" },
      { name: "student_id", label: "Student ID", type: "number" },
    ],
  },
  {
    key: "categories",
    title: "Categories",
    description: "Organize your expenses into categories.",
    idField: "category_id",
    endpoint: "CATEGORIES",
    fields: [
      { name: "category_name", label: "Category Name", type: "text" },
      {
        name: "category_description",
        label: "Category Description",
        type: "text",
      },
      { name: "priority", label: "Priority (Needs or Wants)", type: "text" },
    ],
  },
];

const EMPTY_DATA: Record<string, RowData[]> = {
  budget: [],
  allowance: [],
  expenses: [],
  savings: [],
  categories: [],
};

const NAV_ITEMS = [
  { key: "home", label: "Home", icon: Home },
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "budget", label: "My Budget", icon: Wallet },
  { key: "allowance", label: "Allowance", icon: Banknote },
  { key: "expenses", label: "Expenses", icon: ShoppingBag },
  { key: "savings", label: "Savings", icon: PiggyBank },
  { key: "categories", label: "Categories", icon: Tags },
] as const;

const formatMoney = (value: any) =>
  "₱" + Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getDate = (value: any) => {
  if (!value) return "-";
  return String(value).split("T")[0].split(" ")[0];
};

// ==========================================
// MAIN DASHBOARD
// ==========================================

export default function DashboardPage() {
  const router = useRouter();
  const { isChecking } = useAuthGuard({ requireAuth: true });

  const [activePage, setActivePage] = useState<PageKey>("dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);

  const [records, setRecords] =
    useState<Record<string, RowData[]>>(EMPTY_DATA);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedRow, setSelectedRow] = useState<RowData | null>(null);
  const [formData, setFormData] = useState<RowData>({});

  // ------------------------------------------
  // API ENDPOINTS
  // ------------------------------------------

  const getEndpoint = (resource: Resource) => {
    const endpoints = CONFIG.ENDPOINTS as any;

    const fallback: Record<string, string> = {
      BUDGETS: "/budgets",
      ALLOWANCES: "/allowances",
      EXPENSES: "/expenses",
      SAVINGS: "/savings",
      CATEGORIES: "/categories",
    };

    return endpoints[resource.endpoint] || fallback[resource.endpoint];
  };

  const getResource = (key: PageKey) =>
    RESOURCES.find((item) => item.key === key);

  // ------------------------------------------
  // GET ALL RECORDS
  // ------------------------------------------

  const fetchResource = useCallback(async (resource: Resource) => {
    const result = await apiClient<any>(
      getEndpoint(resource),
      {
        method: "GET",
        requiresAuth: true,
      }
    );

    const list = Array.isArray(result)
      ? result
      : Array.isArray(result?.data)
      ? result.data
      : [];

    setRecords((previous) => ({
      ...previous,
      [resource.key]: list,
    }));
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");

    const results = await Promise.allSettled(
      RESOURCES.map((resource) => fetchResource(resource))
    );

    const failed = results.filter(
      (result) => result.status === "rejected"
    );

    if (failed.length > 0) {
      setError(
        "Some records could not be loaded. Check your API endpoints and try refreshing."
      );
    }

    setLoading(false);
  }, [fetchResource]);

  useEffect(() => {
    if (!isChecking) {
      fetchAll();
    }
  }, [isChecking, fetchAll]);

  // ------------------------------------------
  // REFRESH CURRENT TABLE
  // ------------------------------------------

  const refreshCurrent = async () => {
    const resource = getResource(activePage);

    if (resource) {
      setLoading(true);
      setError("");

      try {
        await fetchResource(resource);
      } catch (err: any) {
        setError(err.message || "Failed to refresh records.");
      } finally {
        setLoading(false);
      }
    } else {
      await fetchAll();
    }
  };

  // ------------------------------------------
  // OPEN CREATE FORM
  // ------------------------------------------

  const openCreateForm = () => {
    const resource = getResource(activePage);
    if (!resource) return;

    const emptyForm: RowData = {};

    resource.fields.forEach((field) => {
      emptyForm[field.name] = "";
    });

    setFormData(emptyForm);
    setEditingId(null);
    setSelectedRow(null);
    setError("");
    setSuccess("");
    setIsFormOpen(true);
  };

  // ------------------------------------------
  // OPEN UPDATE FORM
  // ------------------------------------------

  const openEditForm = (row: RowData) => {
    const resource = getResource(activePage);
    if (!resource) return;

    const values: RowData = {};

    resource.fields.forEach((field) => {
      let value = row[field.name] ?? "";

      if (field.type === "date" && value) {
        value = getDate(value);
      }

      values[field.name] = String(value);
    });

    setFormData(values);
    setEditingId(Number(row[resource.idField]));
    setSelectedRow(null);
    setError("");
    setSuccess("");
    setIsFormOpen(true);
  };

  // ------------------------------------------
  // CLOSE FORM
  // ------------------------------------------

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({});
  };

  // ------------------------------------------
  // CREATE AND UPDATE
  // ------------------------------------------

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const resource = getResource(activePage);
    if (!resource) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      for (const field of resource.fields) {
        if (
          field.required !== false &&
          String(formData[field.name] ?? "").trim() === ""
        ) {
          throw new Error(`Please enter ${field.label}.`);
        }
      }

      const payload: RowData = {};

      resource.fields.forEach((field) => {
        const value = formData[field.name];

        payload[field.name] =
          field.type === "number" ? Number(value) : value;
      });

      if (
        Object.values(payload).some(
          (value) =>
            typeof value === "number" &&
            (!Number.isFinite(value) || value < 0)
        )
      ) {
        throw new Error("Please enter valid positive numbers.");
      }

      if (editingId !== null) {
        await apiClient(
          `${getEndpoint(resource)}/${editingId}`,
          {
            method: "PUT",
            requiresAuth: true,
            body: JSON.stringify(payload),
          }
        );

        setSuccess(`${resource.title} record updated successfully.`);
      } else {
        await apiClient(
          getEndpoint(resource),
          {
            method: "POST",
            requiresAuth: true,
            body: JSON.stringify(payload),
          }
        );

        setSuccess(`New ${resource.title} record added successfully.`);
      }

      closeForm();
      await fetchResource(resource);
    } catch (err: any) {
      setError(err.message || "Unable to save the record.");
    } finally {
      setSubmitting(false);
    }
  };

  // ------------------------------------------
  // READ SINGLE RECORD
  // ------------------------------------------

  const handleRead = async (row: RowData) => {
    const resource = getResource(activePage);
    if (!resource) return;

    const id = row[resource.idField];

    setError("");
    setSuccess("");

    try {
      const result = await apiClient<RowData>(
        `${getEndpoint(resource)}/${id}`,
        {
          method: "GET",
          requiresAuth: true,
        }
      );

      setSelectedRow(result);
      setIsFormOpen(false);
    } catch (err: any) {
      setError(err.message || "Unable to read record.");
    }
  };

  // ------------------------------------------
  // DELETE RECORD
  // ------------------------------------------

  const handleDelete = async (row: RowData) => {
    const resource = getResource(activePage);
    if (!resource) return;

    const id = row[resource.idField];

    const confirmed = window.confirm(
      `Are you sure you want to delete ${resource.title} #${id}?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await apiClient(
        `${getEndpoint(resource)}/${id}`,
        {
          method: "DELETE",
          requiresAuth: true,
        }
      );

      setSuccess(`${resource.title} #${id} deleted successfully.`);
      setSelectedRow(null);

      await fetchResource(resource);
    } catch (err: any) {
      setError(err.message || "Unable to delete record.");
    }
  };

  // ------------------------------------------
  // LOGOUT
  // ------------------------------------------

  const handleLogout = () => {
    clearTokens();
    router.push(CONFIG.ROUTES.LOGIN);
  };

  // ------------------------------------------
  // FINANCIAL TOTALS
  // ------------------------------------------

  const totalBudget = records.budget.reduce(
    (sum, row) => sum + Number(row.budget_amount || 0),
    0
  );

  const totalAllowance = records.allowance.reduce(
    (sum, row) => sum + Number(row.allowance_amount || 0),
    0
  );

  const totalExpenses = records.expenses.reduce(
    (sum, row) => sum + Number(row.amount || 0),
    0
  );

  const totalSavings = records.savings.reduce(
    (sum, row) => sum + Number(row.amount_saved || 0),
    0
  );

  // ------------------------------------------
  // NAVIGATION
  // ------------------------------------------

  const navigate = (page: PageKey) => {
    setActivePage(page);
    setMobileMenu(false);
    setIsFormOpen(false);
    setSelectedRow(null);
    setError("");
    setSuccess("");
  };

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        Loading your finance tracker...
      </div>
    );
  }

  const currentResource = getResource(activePage);
  const currentRecords = currentResource
    ? records[currentResource.key] || []
    : [];

  // ==========================================
  // PAGE DESIGN
  // ==========================================

  return (
    <div className="min-h-screen bg-gray-100">

      {/* MOBILE HEADER */}
      <div className="fixed top-0 z-40 flex w-full items-center justify-between border-b bg-white p-4 md:hidden">
        <h2 className="font-bold text-green-600">
          Student Finance Tracker
        </h2>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenu(!mobileMenu)}
        >
          {mobileMenu ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* SIDEBAR */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-60 flex-col border-r bg-white p-6 transition-transform md:translate-x-0 ${
          mobileMenu ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <h2 className="mb-2 text-lg font-bold text-green-600">
          Student Finance Tracker
        </h2>

        <p className="mb-10 text-xs text-gray-400">
          Track your money wisely
        </p>

        <nav className="flex-1 space-y-3 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.key;

            return (
              <button
                key={item.key}
                onClick={() => navigate(item.key)}
                className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                  active
                    ? "border border-green-400 bg-green-50 font-semibold text-green-600"
                    : "text-gray-600 hover:bg-green-50 hover:text-green-600"
                }`}
              >
                <Icon size={20} />
                {item.label}
              </button>
            );
          })}
        </nav>

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

      {/* MAIN CONTENT */}
      <main className="min-h-screen p-5 pt-20 md:ml-60 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* PAGE TITLE */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {activePage === "home"
                  ? "Home"
                  : activePage === "dashboard"
                  ? "Dashboard"
                  : currentResource?.title}
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                {activePage === "home"
                  ? "Make wise choices with your money."
                  : activePage === "dashboard"
                  ? "Your personal financial overview."
                  : currentResource?.description}
              </p>
            </div>

            <Button
              variant="outline"
              onClick={refreshCurrent}
              disabled={loading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${
                  loading ? "animate-spin" : ""
                }`}
              />
              Refresh
            </Button>
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* SUCCESS MESSAGE */}
          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}

          {/* ================================= */}
          {/* HOME PAGE */}
          {/* ================================= */}

          {activePage === "home" && (
            <>
              <Card className="border-green-200 shadow-sm">
                <CardContent className="space-y-4 p-8">
                  <h2 className="text-3xl font-bold text-green-600">
                    Welcome to Student Finance Tracker!
                  </h2>

                  <p className="max-w-2xl text-gray-600">
                    Managing your money is an important part of student life.
                    Keep track of your allowance, plan your budget, monitor
                    your expenses, and save money for your future needs.
                  </p>

                  <Button
                    onClick={() => navigate("dashboard")}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    View My Dashboard
                  </Button>
                </CardContent>
              </Card>

              <h2 className="text-lg font-bold text-gray-800">
                Simple Money Management Tips
              </h2>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  {
                    title: "Plan Your Budget",
                    description:
                      "Set a budget before spending your allowance.",
                    icon: Wallet,
                  },
                  {
                    title: "Spend Wisely",
                    description:
                      "Prioritize your needs before buying your wants.",
                    icon: ShoppingBag,
                  },
                  {
                    title: "Save Regularly",
                    description:
                      "Set aside some money for your future needs.",
                    icon: PiggyBank,
                  },
                ].map((tip) => {
                  const Icon = tip.icon;

                  return (
                    <Card key={tip.title} className="shadow-sm">
                      <CardContent className="space-y-3 p-5">
                        <Icon className="text-green-600" size={28} />
                        <h3 className="font-semibold text-gray-800">
                          {tip.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {tip.description}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {/* ================================= */}
          {/* DASHBOARD PAGE */}
          {/* ================================= */}

          {activePage === "dashboard" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                <Card className="shadow-sm">
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="font-semibold text-gray-700">
                        Total Budget
                      </p>
                      <Wallet className="text-green-500" size={25} />
                    </div>
                    <h2 className="text-2xl font-bold text-green-600">
                      {formatMoney(totalBudget)}
                    </h2>
                    <p className="mt-2 text-xs text-gray-400">
                      Your planned budget
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="font-semibold text-gray-700">
                        Total Allowance
                      </p>
                      <Banknote className="text-blue-500" size={25} />
                    </div>
                    <h2 className="text-2xl font-bold text-blue-600">
                      {formatMoney(totalAllowance)}
                    </h2>
                    <p className="mt-2 text-xs text-gray-400">
                      Your received allowance
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="font-semibold text-gray-700">
                        Total Expenses
                      </p>
                      <ShoppingBag className="text-red-500" size={25} />
                    </div>
                    <h2 className="text-2xl font-bold text-red-500">
                      {formatMoney(totalExpenses)}
                    </h2>
                    <p className="mt-2 text-xs text-gray-400">
                      Your total spending
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="font-semibold text-gray-700">
                        Total Savings
                      </p>
                      <PiggyBank className="text-purple-500" size={25} />
                    </div>
                    <h2 className="text-2xl font-bold text-purple-600">
                      {formatMoney(totalSavings)}
                    </h2>
                    <p className="mt-2 text-xs text-gray-400">
                      Your saved money
                    </p>
                  </CardContent>
                </Card>

              </div>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Recent Expenses</CardTitle>
                  <CardDescription>
                    Your latest spending activities.
                  </CardDescription>
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
                        </tr>
                      </thead>

                      <tbody>
                        {records.expenses.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-gray-400">
                              No expenses recorded yet.
                            </td>
                          </tr>
                        ) : (
                          [...records.expenses]
                            .sort(
                              (a, b) =>
                                Number(b.expense_id) -
                                Number(a.expense_id)
                            )
                            .slice(0, 5)
                            .map((expense) => (
                              <tr key={expense.expense_id} className="border-b">
                                <td className="p-3">{expense.expense_id}</td>
                                <td className="p-3">{expense.category_id}</td>
                                <td className="p-3">
                                  {getDate(expense.expense_date)}
                                </td>
                                <td className="p-3 font-semibold text-red-500">
                                  -{formatMoney(expense.amount)}
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate("expenses")}
                  >
                    View All Expenses
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {/* ================================= */}
          {/* RESOURCE FORMS */}
          {/* ================================= */}

          {currentResource && (
            <>
              {/* ADD / UPDATE FORM */}
              {isFormOpen && (
                <Card className="border-green-300 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>
                        {editingId !== null
                          ? `Update ${currentResource.title} #${editingId}`
                          : `Add New ${currentResource.title}`}
                      </CardTitle>
                      <CardDescription>
                        Enter the information below.
                      </CardDescription>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={closeForm}
                    >
                      <X size={18} />
                    </Button>
                  </CardHeader>

                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {currentResource.fields.map((field) => (
                          <div key={field.name} className="space-y-2">
                            <label
                              htmlFor={field.name}
                              className="text-sm font-medium text-gray-700"
                            >
                              {field.label}
                            </label>

                            <input
                              id={field.name}
                              type={field.type}
                              min={field.type === "number" ? "0" : undefined}
                              step={
                                field.type === "number" ? "0.01" : undefined
                              }
                              value={formData[field.name] ?? ""}
                              onChange={(e) =>
                                setFormData((previous) => ({
                                  ...previous,
                                  [field.name]: e.target.value,
                                }))
                              }
                              required={field.required !== false}
                              className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                            />
                          </div>
                        ))}
                      </div>

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
                            : "Add Record"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* READ DETAILS */}
              {selectedRow && (
                <Card className="border-green-300 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Record Details</CardTitle>
                      <CardDescription>
                        {currentResource.title} #
                        {selectedRow[currentResource.idField]}
                      </CardDescription>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedRow(null)}
                    >
                      <X size={18} />
                    </Button>
                  </CardHeader>

                  <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-xs text-gray-400">
                        {currentResource.idField}
                      </p>
                      <p className="font-semibold">
                        {selectedRow[currentResource.idField]}
                      </p>
                    </div>

                    {currentResource.fields.map((field) => (
                      <div key={field.name}>
                        <p className="text-xs text-gray-400">
                          {field.label}
                        </p>
                        <p className="font-semibold">
                          {field.type === "number" &&
                          field.name.includes("amount")
                            ? formatMoney(selectedRow[field.name])
                            : field.type === "date"
                            ? getDate(selectedRow[field.name])
                            : selectedRow[field.name]}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* RESOURCE TABLE */}
              <Card className="shadow-sm">
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>
                      {currentResource.title} Records
                    </CardTitle>
                    <CardDescription>
                      Manage your records (GET, POST, PUT, DELETE).
                    </CardDescription>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={openCreateForm}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add {currentResource.title}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b bg-gray-50 text-gray-500">
                        <tr>
                          <th className="p-3">ID</th>

                          {currentResource.fields.map((field) => (
                            <th key={field.name} className="p-3">
                              {field.label}
                            </th>
                          ))}

                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {loading ? (
                          <tr>
                            <td
                              colSpan={currentResource.fields.length + 2}
                              className="p-6 text-center text-gray-400"
                            >
                              Loading records...
                            </td>
                          </tr>
                        ) : currentRecords.length === 0 ? (
                          <tr>
                            <td
                              colSpan={currentResource.fields.length + 2}
                              className="p-6 text-center text-gray-400"
                            >
                              No records found. Click Add to create one.
                            </td>
                          </tr>
                        ) : (
                          currentRecords.map((row) => (
                            <tr
                              key={row[currentResource.idField]}
                              className="border-b transition hover:bg-gray-50"
                            >
                              <td className="p-3 font-medium">
                                {row[currentResource.idField]}
                              </td>

                              {currentResource.fields.map((field) => (
                                <td key={field.name} className="p-3">
                                  {field.type === "number" &&
                                  field.name.includes("amount")
                                    ? formatMoney(row[field.name])
                                    : field.type === "date"
                                    ? getDate(row[field.name])
                                    : row[field.name]}
                                </td>
                              ))}

                              <td className="p-3">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRead(row)}
                                    title="Read"
                                  >
                                    <Eye size={15} />
                                    <span className="ml-1 hidden lg:inline">
                                      Read
                                    </span>
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => openEditForm(row)}
                                    title="Update"
                                  >
                                    <Pencil size={15} />
                                    <span className="ml-1 hidden lg:inline">
                                      Update
                                    </span>
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDelete(row)}
                                    title="Delete"
                                  >
                                    <Trash2 size={15} />
                                    <span className="ml-1 hidden lg:inline">
                                      Delete
                                    </span>
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
            </>
          )}

        </div>
      </main>
    </div>
  );
}
