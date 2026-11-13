
"use client";

import { useRouter } from "next/navigation";
import { useAuthGuard } from "../Hooks/useAuthGuard";
import { clearTokens } from "../lib/auth";
import { CONFIG } from "../lib/config";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Home, LayoutDashboard, Wallet, Banknote, ShoppingBag, PiggyBank, Tags, LogOut} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();

  const { isChecking } = useAuthGuard({
    requireAuth: true,
  });

  const handleLogout = () => {
    clearTokens();
    router.push(CONFIG.ROUTES.LOGIN);
  };

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

          <a href="#home"
            className="flex items-center gap-3 rounded-lg p-3 text-gray-600 hover:bg-green-50">
            <Home size={19} />
            Home
          </a>

          <a href="#dashboard"
            className="flex items-center gap-3 rounded-lg border border-green-400 bg-green-50 p-3 font-semibold text-green-600">
            <LayoutDashboard size={19} />
            Dashboard
          </a>

          <a href="#budget"
            className="flex items-center gap-3 rounded-lg p-3 text-gray-600 hover:bg-green-50">
            <Wallet size={19} />
            My Budget
          </a>

          <a href="#allowance"
            className="flex items-center gap-3 rounded-lg p-3 text-gray-600 hover:bg-green-50">
            <Banknote size={19} />
            Allowance
          </a>

          <a href="#expenses"
            className="flex items-center gap-3 rounded-lg p-3 text-gray-600 hover:bg-green-50">
            <ShoppingBag size={19} />
            Expenses
          </a>

          <a href="#savings"
            className="flex items-center gap-3 rounded-lg p-3 text-gray-600 hover:bg-green-50">
            <PiggyBank size={19} />
            Savings
          </a>

          <a href="#categories"
            className="flex items-center gap-3 rounded-lg p-3 text-gray-600 hover:bg-green-50">
            <Tags size={19} />
            Categories
          </a>

        </nav>

        {/* Logout at the bottom */}
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

        <div className="mx-auto max-w-6xl">

          {/* Header */}
          <div id="home" className="mb-6 flex items-center justify-between">
            <div>
              <h1 id="dashboard" className="text-2xl font-bold text-gray-800">
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

                <h2 className="text-2xl font-bold text-green-600">
                  ₱0
                </h2>

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

                <h2 className="text-2xl font-bold text-blue-600">
                  ₱0
                </h2>

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
                  ₱0
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

                <h2 className="text-2xl font-bold text-purple-600">
                  ₱0
                </h2>

                <p className="mt-2 text-xs text-gray-400">
                  Your saved money
                </p>
              </CardContent>
            </Card>

          </div>


          {/* Recent Expenses */}
          <Card id="expenses" className="mt-5 border-green-200 shadow-sm">

            <CardHeader>
              <CardTitle>
                Recent Expenses
              </CardTitle>

              <p className="text-sm text-gray-400">
                Check your latest spending activities.
              </p>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">

                <table className="w-full text-left text-sm">

                  <thead className="border-b text-gray-500">
                    <tr>
                      <th className="p-3">Category</th>
                      <th className="p-3">Date</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>

                  <tbody>

                    <tr className="border-b">
                      <td className="p-3">Shopping</td>
                      <td className="p-3">2026-09-29</td>
                      <td className="p-3 text-right font-semibold text-red-500">
                        -₱0
                      </td>
                    </tr>

                    <tr className="border-b">
                      <td className="p-3">Food and Transportation</td>
                      <td className="p-3">2026-09-18</td>
                      <td className="p-3 text-right font-semibold text-red-500">
                        -₱0
                      </td>
                    </tr>

                    <tr className="border-b">
                      <td className="p-3">Entertainment</td>
                      <td className="p-3">2026-09-15</td>
                      <td className="p-3 text-right font-semibold text-red-500">
                        -₱0
                      </td>
                    </tr>

                    <tr>
                      <td className="p-3">Rent</td>
                      <td className="p-3">2026-09-01</td>
                      <td className="p-3 text-right font-semibold text-red-500">
                        -₱0
                      </td>
                    </tr>

                  </tbody>
                </table>

              </div>
            </CardContent>
          </Card>

          {/* Footer */}
         

        </div>
      </main>
    </div>
  );
}
