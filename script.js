"use strict";

// ============================================
// 1. APPLICATION CONFIGURATION
// ============================================

const STORAGE_KEYS = {
  transactions: "fintrack_transactions",
  budget: "fintrack_budget",
};

const VALID_TYPES = ["income", "expense"];

const VALID_CATEGORIES = [
  "Food",
  "Transport",
  "Rent",
  "Education",
  "Entertainment",
  "Salary",
  "Business",
  "Other",
];

let transactions = loadTransactions();
let monthlyBudget = loadBudget();
let editingTransactionId = null;

let incomeExpenseChart = null;
let categoryChart = null;

// ============================================
// 2. DOM ELEMENTS
// ============================================

const elements = {
  transactionForm: document.getElementById("transactionForm"),

  description: document.getElementById("description"),
  amount: document.getElementById("amount"),
  type: document.getElementById("type"),
  category: document.getElementById("category"),
  date: document.getElementById("date"),

  transactionList: document.getElementById("transactionList"),
  emptyMessage: document.getElementById("emptyMessage"),

  search: document.getElementById("searchTransaction"),
  filterType: document.getElementById("filterType"),
  filterCategory: document.getElementById("filterCategory"),

  totalBalance: document.getElementById("totalBalance"),
  totalIncome: document.getElementById("totalIncome"),
  totalExpenses: document.getElementById("totalExpenses"),
  remainingBudget: document.getElementById("remainingBudget"),

  budgetForm: document.getElementById("budgetForm"),
  budgetAmount: document.getElementById("budgetAmount"),
  budgetPercentage: document.getElementById("budgetPercentage"),
  budgetProgressBar: document.getElementById("budgetProgressBar"),
  budgetStatus: document.getElementById("budgetStatus"),

  incomeExpenseCanvas: document.getElementById("incomeExpenseChart"),
  categoryCanvas: document.getElementById("categoryChart"),
};

// ============================================
// 3. DATA VALIDATION AND STORAGE
// ============================================

function isValidTransaction(transaction) {
  return (
    transaction &&
    typeof transaction.id === "string" &&
    typeof transaction.description === "string" &&
    Number.isFinite(Number(transaction.amount)) &&
    Number(transaction.amount) > 0 &&
    VALID_TYPES.includes(transaction.type) &&
    VALID_CATEGORIES.includes(transaction.category) &&
    typeof transaction.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(transaction.date)
  );
}

function loadTransactions() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEYS.transactions);

    if (!savedData) {
      return [];
    }

    const parsedData = JSON.parse(savedData);

    if (!Array.isArray(parsedData)) {
      return [];
    }

    return parsedData.filter(isValidTransaction).map((transaction) => ({
      ...transaction,
      amount: Number(transaction.amount),
    }));
  } catch (error) {
    console.error("Transaction loading failed:", error);
    return [];
  }
}

function saveTransactions() {
  try {
    localStorage.setItem(
      STORAGE_KEYS.transactions,
      JSON.stringify(transactions),
    );

    return true;
  } catch (error) {
    console.error("Transaction saving failed:", error);

    alert("Your transactions could not be saved. Check browser storage.");

    return false;
  }
}

function loadBudget() {
  try {
    const savedBudget = localStorage.getItem(STORAGE_KEYS.budget);

    if (savedBudget === null) {
      return 0;
    }

    const budget = Number(savedBudget);

    return Number.isFinite(budget) && budget >= 0 ? budget : 0;
  } catch (error) {
    console.error("Budget loading failed:", error);
    return 0;
  }
}

function saveBudget() {
  try {
    localStorage.setItem(STORAGE_KEYS.budget, String(monthlyBudget));

    return true;
  } catch (error) {
    console.error("Budget saving failed:", error);

    alert("Your budget could not be saved. Check browser storage.");

    return false;
  }
}

// ============================================
// 4. HELPER FUNCTIONS
// ============================================

function generateId() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return entities[character];
  });
}

function getTodayDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCurrentMonthKey() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

// ============================================
// 5. TRANSACTION FORM
// ============================================

elements.transactionForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const description = elements.description.value.trim();
  const amount = Number(elements.amount.value);
  const type = elements.type.value;
  const category = elements.category.value;
  const date = elements.date.value;

  if (!description) {
    alert("Please enter a transaction description.");
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    alert("Please enter a valid amount greater than zero.");
    return;
  }

  if (!VALID_TYPES.includes(type)) {
    alert("Please select a valid transaction type.");
    return;
  }

  if (!VALID_CATEGORIES.includes(category)) {
    alert("Please select a valid category.");
    return;
  }

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    alert("Please select a valid transaction date.");
    return;
  }

  const transactionData = {
    description,
    amount,
    type,
    category,
    date,
  };

  if (editingTransactionId !== null) {
    transactions = transactions.map((transaction) => {
      if (transaction.id === editingTransactionId) {
        return {
          ...transaction,
          ...transactionData,
        };
      }

      return transaction;
    });
  } else {
    transactions.push({
      id: generateId(),
      ...transactionData,
      createdAt: new Date().toISOString(),
    });
  }

  if (!saveTransactions()) {
    return;
  }

  resetTransactionForm();
  refreshApplication();
});

function resetTransactionForm() {
  editingTransactionId = null;

  elements.transactionForm.reset();

  elements.date.value = getTodayDate();

  elements.transactionForm.querySelector('button[type="submit"]').textContent =
    "Add Transaction";
}

// ============================================
// 6. TRANSACTION RENDERING
// ============================================

function renderTransactions() {
  const filteredTransactions = getFilteredTransactions();

  elements.transactionList.innerHTML = "";

  elements.emptyMessage.style.display =
    filteredTransactions.length === 0 ? "block" : "none";

  filteredTransactions.forEach((transaction) => {
    const row = document.createElement("tr");

    const sign = transaction.type === "income" ? "+" : "-";

    const safeId = escapeHTML(transaction.id);

    row.innerHTML = `
            <td>${escapeHTML(transaction.description)}</td>

            <td>${escapeHTML(transaction.category)}</td>

            <td>${escapeHTML(transaction.date)}</td>

            <td>
                <span class="badge ${transaction.type}">
                    ${transaction.type}
                </span>
            </td>

            <td>
                ${sign}${formatCurrency(transaction.amount)}
            </td>

            <td>
                <button
                    class="action-btn edit-btn"
                    data-action="edit"
                    data-id="${safeId}">
                    Edit
                </button>

                <button
                    class="action-btn delete-btn"
                    data-action="delete"
                    data-id="${safeId}">
                    Delete
                </button>
            </td>
        `;

    elements.transactionList.appendChild(row);
  });
}

// ============================================
// 7. SEARCH AND FILTERING
// ============================================

function getFilteredTransactions() {
  const searchTerm = elements.search.value.toLowerCase().trim();

  const selectedType = elements.filterType.value;
  const selectedCategory = elements.filterCategory.value;

  return transactions
    .filter((transaction) => {
      const description = transaction.description.toLowerCase();
      const category = transaction.category.toLowerCase();

      const matchesSearch =
        description.includes(searchTerm) || category.includes(searchTerm);

      const matchesType =
        selectedType === "all" || transaction.type === selectedType;

      const matchesCategory =
        selectedCategory === "all" || transaction.category === selectedCategory;

      return matchesSearch && matchesType && matchesCategory;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

elements.search.addEventListener("input", renderTransactions);
elements.filterType.addEventListener("change", renderTransactions);
elements.filterCategory.addEventListener("change", renderTransactions);

// ============================================
// 8. EDITING AND DELETING
// ============================================

elements.transactionList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");

  if (!button) {
    return;
  }

  const id = button.dataset.id;
  const action = button.dataset.action;

  if (action === "edit") {
    editTransaction(id);
  }

  if (action === "delete") {
    deleteTransaction(id);
  }
});

function editTransaction(id) {
  const transaction = transactions.find((item) => item.id === id);

  if (!transaction) {
    return;
  }

  editingTransactionId = id;

  elements.description.value = transaction.description;
  elements.amount.value = transaction.amount;
  elements.type.value = transaction.type;
  elements.category.value = transaction.category;
  elements.date.value = transaction.date;

  elements.transactionForm.querySelector('button[type="submit"]').textContent =
    "Update Transaction";

  elements.transactionForm.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
}

function deleteTransaction(id) {
  const confirmed = confirm(
    "Are you sure you want to delete this transaction?",
  );

  if (!confirmed) {
    return;
  }

  const originalTransactions = transactions;

  transactions = transactions.filter((transaction) => transaction.id !== id);

  if (!saveTransactions()) {
    transactions = originalTransactions;
    return;
  }

  if (editingTransactionId === id) {
    resetTransactionForm();
  }

  refreshApplication();
}

// ============================================
// 9. FINANCIAL CALCULATIONS
// ============================================

function calculateTotals() {
  return transactions.reduce(
    (totals, transaction) => {
      if (transaction.type === "income") {
        totals.income += transaction.amount;
      } else {
        totals.expenses += transaction.amount;
      }

      return totals;
    },
    {
      income: 0,
      expenses: 0,
    },
  );
}

function updateDashboard() {
  const totals = calculateTotals();

  const balance = totals.income - totals.expenses;

  elements.totalIncome.textContent = formatCurrency(totals.income);

  elements.totalExpenses.textContent = formatCurrency(totals.expenses);

  elements.totalBalance.textContent = formatCurrency(balance);

  updateBudgetDashboard();
}

// ============================================
// 10. MONTHLY BUDGET MANAGEMENT
// ============================================

function getCurrentMonthExpenses() {
  const currentMonth = getCurrentMonthKey();

  return transactions
    .filter((transaction) => {
      return (
        transaction.type === "expense" &&
        transaction.date.startsWith(currentMonth)
      );
    })
    .reduce((total, transaction) => {
      return total + transaction.amount;
    }, 0);
}

elements.budgetForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const amount = Number(elements.budgetAmount.value);

  if (!Number.isFinite(amount) || amount <= 0) {
    alert("Please enter a valid monthly budget.");
    return;
  }

  const previousBudget = monthlyBudget;

  monthlyBudget = amount;

  if (!saveBudget()) {
    monthlyBudget = previousBudget;
    return;
  }

  updateBudgetDashboard();

  alert("Your monthly budget has been updated.");
});

function updateBudgetDashboard() {
  const monthlyExpenses = getCurrentMonthExpenses();

  const remaining = monthlyBudget - monthlyExpenses;

  const percentage =
    monthlyBudget > 0 ? (monthlyExpenses / monthlyBudget) * 100 : 0;

  elements.remainingBudget.textContent = formatCurrency(remaining);

  elements.budgetPercentage.textContent = `${Math.round(percentage)}%`;

  elements.budgetProgressBar.style.width = `${Math.min(percentage, 100)}%`;

  // Change progress bar appearance based on spending.

  if (percentage >= 100) {
    elements.budgetProgressBar.style.background = "#dc2626";
  } else if (percentage >= 80) {
    elements.budgetProgressBar.style.background = "#f59e0b";
  } else {
    elements.budgetProgressBar.style.background = "#2563eb";
  }

  if (monthlyBudget === 0) {
    elements.budgetStatus.textContent =
      "Set a monthly budget to monitor your spending.";
  } else if (percentage > 100) {
    elements.budgetStatus.textContent = `Budget exceeded by ${formatCurrency(Math.abs(remaining))}.`;
  } else if (percentage >= 80) {
    elements.budgetStatus.textContent =
      "Warning: You are approaching your monthly spending limit.";
  } else {
    elements.budgetStatus.textContent = `${formatCurrency(remaining)} remaining this month.`;
  }
}

// ============================================
// 11. FINANCIAL ANALYTICS
// ============================================

function updateCharts() {
  if (typeof Chart === "undefined") {
    console.warn("Chart.js is unavailable. Charts were not loaded.");
    return;
  }

  const totals = calculateTotals();

  const currentMonthExpenses = transactions.filter((transaction) => {
    return (
      transaction.type === "expense" &&
      transaction.date.startsWith(getCurrentMonthKey())
    );
  });

  updateIncomeExpenseChart(totals);
  updateCategoryChart(currentMonthExpenses);
}

function updateIncomeExpenseChart(totals) {
  const context = elements.incomeExpenseCanvas.getContext("2d");

  if (incomeExpenseChart) {
    incomeExpenseChart.destroy();
  }

  incomeExpenseChart = new Chart(context, {
    type: "bar",

    data: {
      labels: ["Income", "Expenses"],

      datasets: [
        {
          label: "Amount (KSh)",

          data: [totals.income, totals.expenses],

          backgroundColor: ["#16a34a", "#dc2626"],

          borderRadius: 8,
        },
      ],
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          display: false,
        },
      },

      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

function updateCategoryChart(expenses) {
  const categoryTotals = {};

  expenses.forEach((transaction) => {
    categoryTotals[transaction.category] =
      (categoryTotals[transaction.category] || 0) + transaction.amount;
  });

  const labels = Object.keys(categoryTotals);
  const values = Object.values(categoryTotals);

  const context = elements.categoryCanvas.getContext("2d");

  if (categoryChart) {
    categoryChart.destroy();
  }

  categoryChart = new Chart(context, {
    type: "doughnut",

    data: {
      labels,

      datasets: [
        {
          data: values,

          backgroundColor: [
            "#2563eb",
            "#16a34a",
            "#f59e0b",
            "#dc2626",
            "#9333ea",
            "#0891b2",
            "#db2777",
            "#64748b",
          ],

          borderWidth: 2,
          borderColor: "#ffffff",
        },
      ],
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });
}

// ============================================
// 12. APPLICATION REFRESH
// ============================================

function refreshApplication() {
  renderTransactions();
  updateDashboard();
  updateCharts();
}

// ============================================
// 13. APPLICATION INITIALISATION
// ============================================

function initialiseApp() {
  elements.date.value = getTodayDate();

  elements.budgetAmount.value = monthlyBudget > 0 ? monthlyBudget : "";

  refreshApplication();
}

initialiseApp();
