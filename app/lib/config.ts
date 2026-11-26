
export const CONFIG = {
  API_BASE_URL:
    process.env.NEXT_PUBLIC_API_BASE_URL || "https://backend-ykig.onrender.com",

  STORAGE_KEYS: {
    ACCESS_TOKEN: "accessToken",
    REFRESH_TOKEN: "refreshToken",
  },

  ROUTES: {
    HOME: "/",
    LOGIN: "/login",
    REGISTER: "/register",
    DASHBOARD: "/dashboard",
  },

  ENDPOINTS: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",

    STUDENTS: "/students",
    CATEGORIES: "/categories",
    BUDGETS: "/budgets",
    ALLOWANCES: "/allowances",
    EXPENSES: "/expenses",
    SAVINGS: "/savings",
  },
} as const;
