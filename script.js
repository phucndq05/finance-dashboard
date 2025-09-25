// ==========================================================================
// 1. Element Selections
// ==========================================================================
const transactionForm = document.getElementById('transaction-form');
const transactionDate = document.getElementById('date');
const transactionDescription = document.getElementById('description');
const transactionCategory = document.getElementById('category');
const transactionAmount = document.getElementById('amount');
const budgetForm = document.getElementById('budget-form');
const budgetInputs = document.querySelectorAll('#budget-form input[type="number"]');
const transactionList = document.getElementById('transaction-list');
const balanceDisplay = document.querySelector('#balance p');
const incomeDisplay = document.querySelector('#income p');
const expenseDisplay = document.querySelector('#expense p');
const submitBtn = document.getElementById('submit-btn');
const themeToggle = document.getElementById('theme-toggle');
const currencySelect = document.getElementById('currency-select');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editTypeIncome = document.getElementById('edit-type-income');
const editTypeExpense = document.getElementById('edit-type-expense');
const editDate = document.getElementById('edit-date');
const editCategory = document.getElementById('edit-category');
const editDescription = document.getElementById('edit-description');
const editAmount = document.getElementById('edit-amount');
const modalDismissTriggers = document.querySelectorAll('[data-dismiss="modal"]');
// Filters and sorting controls
const searchInput = document.getElementById('search-input');
const filterType = document.getElementById('filter-type');
const filterCategory = document.getElementById('filter-category');
const sortBySelect = document.getElementById('sort-by');
const sortDirSelect = document.getElementById('sort-dir');
const desktopCardsQuery = window.matchMedia('(min-width: 769px)');


// ==========================================================================
// 2. Global State (Our "Database")
// ==========================================================================
const savedTransactions = JSON.parse(localStorage.getItem('transactions'));
let transactions = savedTransactions || [];
const savedBudgets = JSON.parse(localStorage.getItem('budgets'));
let budgets = savedBudgets || {};
let editingId = null; // Track currently edited transaction id
let lastFocusedElement = null;
let expenseByCategoryChart = null;
let incomeExpenseChart = null;
const exportButton = document.getElementById('export-csv');

// ==========================================================================
// 2.1 Formatting helpers (locale currency)
// ==========================================================================
const CURRENCY_SETTINGS = {
    USD: {
        code: 'USD',
        label: 'USD - US Dollar',
        locale: 'en-US',
        symbol: '$',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        placeholder: '0.00',
        step: '0.01'
    },
    VND: {
        code: 'VND',
        label: 'VND - Vietnamese Dong',
        locale: 'vi-VN',
        symbol: '₫',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        placeholder: '0',
        step: '1'
    },
    JPY: {
        code: 'JPY',
        label: 'JPY - Japanese Yen',
        locale: 'ja-JP',
        symbol: '¥',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        placeholder: '0',
        step: '1'
    },
    KRW: {
        code: 'KRW',
        label: 'KRW - South Korean Won',
        locale: 'ko-KR',
        symbol: '₩',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        placeholder: '0',
        step: '1'
    },
    EUR: {
        code: 'EUR',
        label: 'EUR - Euro',
        locale: 'de-DE',
        symbol: '€',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        placeholder: '0.00',
        step: '0.01'
    },
    GBP: {
        code: 'GBP',
        label: 'GBP - British Pound',
        locale: 'en-GB',
        symbol: '£',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        placeholder: '0.00',
        step: '0.01'
    },
    AUD: {
        code: 'AUD',
        label: 'AUD - Australian Dollar',
        locale: 'en-AU',
        symbol: '$',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        placeholder: '0.00',
        step: '0.01'
    },
    CAD: {
        code: 'CAD',
        label: 'CAD - Canadian Dollar',
        locale: 'en-CA',
        symbol: '$',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        placeholder: '0.00',
        step: '0.01'
    },
    SGD: {
        code: 'SGD',
        label: 'SGD - Singapore Dollar',
        locale: 'en-SG',
        symbol: '$',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        placeholder: '0.00',
        step: '0.01'
    }
};

const DEFAULT_CURRENCY = 'USD';

function createCurrencyFormatter(currencyCode) {
    const settings = CURRENCY_SETTINGS[currencyCode] || CURRENCY_SETTINGS[DEFAULT_CURRENCY];
    return new Intl.NumberFormat(settings.locale || navigator.language || 'en-US', {
        style: 'currency',
        currency: settings.code,
        minimumFractionDigits: settings.minimumFractionDigits,
        maximumFractionDigits: settings.maximumFractionDigits
    });
}

let currentCurrency = localStorage.getItem('currency') || DEFAULT_CURRENCY;
if (!CURRENCY_SETTINGS[currentCurrency]) {
    currentCurrency = DEFAULT_CURRENCY;
}
let currencyFormatter = createCurrencyFormatter(currentCurrency);

function formatCurrency(amount) {
    return currencyFormatter.format(amount || 0);
}

function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[&<>"']/g, match => {
        switch (match) {
            case '&':
                return '&amp;';
            case '<':
                return '&lt;';
            case '>':
                return '&gt;';
            case '"':
                return '&quot;';
            case "'":
                return '&#39;';
            default:
                return match;
        }
    });
}


// ==========================================================================
// 3. Functions
// ==========================================================================

/**
 * Saves the current state to local storage.
 */
function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('budgets', JSON.stringify(budgets));
}

function applyCurrencyToBudgetInputs() {
    const settings = CURRENCY_SETTINGS[currentCurrency] || CURRENCY_SETTINGS[DEFAULT_CURRENCY];
    document.querySelectorAll('.currency-symbol').forEach(symbolEl => {
        symbolEl.textContent = settings.symbol;
    });
    budgetInputs.forEach(input => {
        input.placeholder = settings.placeholder;
        input.step = settings.step;
    });
    if (transactionAmount) {
        transactionAmount.step = settings.step;
    }
    if (editAmount) {
        editAmount.step = settings.step;
    }
}

function setCurrency(currencyCode) {
    if (!CURRENCY_SETTINGS[currencyCode]) return;
    currentCurrency = currencyCode;
    localStorage.setItem('currency', currentCurrency);
    currencyFormatter = createCurrencyFormatter(currentCurrency);
    applyCurrencyToBudgetInputs();
    updateSummary();
    renderTransactions();
    updateCharts();
}

/**
 * Calculates spending per category and updates budget progress bars.
 */
function updateBudgetProgress() {
    // 1. Calculate total spending for each category
    const spendingByCategory = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, transaction) => {
            const category = transaction.category;
            acc[category] = (acc[category] || 0) + transaction.amount;
            return acc;
        }, {});

    // 2. Update the progress bar for each budget item
    budgetInputs.forEach(input => {
        const category = input.dataset.category;
        const budgetAmount = budgets[category] || 0;
        const spentAmount = spendingByCategory[category] || 0;
        // Construct the ID for the progress bar fill element
        const progressBarFill = document.getElementById(`progress-${category.toLowerCase()}`);

        if (!progressBarFill) return; // Skip if no progress bar element

        if (budgetAmount > 0) {
            const percentage = Math.min((spentAmount / budgetAmount) * 100, 100);
            const rounded = Math.round(percentage);
            progressBarFill.style.width = `${percentage}%`;
            // Set visible percent label on the bar's container
            progressBarFill.parentElement.setAttribute('data-progress', `${rounded}%`);

            // Update color based on percentage
            progressBarFill.classList.remove('warning', 'danger');
            if (percentage >= 90) {
                progressBarFill.classList.add('danger');
            } else if (percentage >= 70) {
                progressBarFill.classList.add('warning');
            }
        } else {
            progressBarFill.style.width = '0%'; // No budget set, so progress is 0
            progressBarFill.parentElement.setAttribute('data-progress', '0%');
        }
    });
}


/**
 * Handles the submission of the budget form.
 */
function saveBudgets(event) {
    event.preventDefault();
    budgetInputs.forEach(input => {
        const category = input.dataset.category;
        const value = input.value;
        if (category) {
            if (value && !isNaN(parseFloat(value)) && parseFloat(value) >= 0) {
                budgets[category] = parseFloat(value);
            } else {
                delete budgets[category];
            }
        }
    });

    updateLocalStorage();
    updateBudgetProgress(); // Update progress bars immediately
    showToast('Monthly budgets saved.', 'success');
}

/**
 * Loads budget data and populates the form fields.
 */
function loadBudgets() {
    budgetInputs.forEach(input => {
        const category = input.dataset.category;
        if (category && budgets[category] !== undefined) {
            input.value = budgets[category];
        } else {
            input.value = '';
        }
    });
}


/**
 * Calculates total income, total expense, and balance, then updates the DOM.
 */
function updateSummary() {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;
    balanceDisplay.innerText = formatCurrency(balance);
    incomeDisplay.innerText = `+${formatCurrency(totalIncome)}`;
    expenseDisplay.innerText = `-${formatCurrency(totalExpense)}`;
}

const CHART_PALETTE = [
    '#a5b4fc', '#f9a8d4', '#fcd0ba', '#bbf7d0', '#bfdbfe',
    '#fde68a', '#c7d2fe', '#fbcfe8', '#fecdd3', '#bae6fd'
];
const BAR_SERIES = [
    { label: 'Income', fill: 'rgba(134, 239, 172, 0.85)', border: 'rgba(34, 197, 94, 0.9)' },
    { label: 'Expense', fill: 'rgba(252, 165, 165, 0.85)', border: 'rgba(248, 113, 113, 0.9)' }
];

function toggleChartEmptyState(chartId, isEmpty) {
    const emptyEl = document.querySelector(`[data-chart-empty="${chartId}"]`);
    if (!emptyEl) return;
    emptyEl.style.display = isEmpty ? 'flex' : 'none';
}

function updateChartLegend(chartId, entries) {
    const legend = document.querySelector(`[data-chart-legend="${chartId}"]`);
    if (!legend) return;
    legend.innerHTML = '';
    if (!entries || !entries.length) {
        legend.classList.remove('show');
        return;
    }
    legend.classList.add('show');
    entries.forEach(entry => {
        const li = document.createElement('li');
        const swatch = document.createElement('span');
        swatch.className = 'legend-swatch';
        swatch.style.setProperty('--swatch-color', entry.color);
        const text = document.createElement('span');
        text.textContent = entry.value != null ? `${entry.label}: ${formatCurrency(entry.value)}` : entry.label;
        li.appendChild(swatch);
        li.appendChild(text);
        legend.appendChild(li);
    });
}

function getCanvasContext(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || canvas.width || 320;
    const height = canvas.clientHeight || canvas.height || 240;
    const scaledWidth = width * ratio;
    const scaledHeight = height * ratio;
    if (canvas.width !== scaledWidth || canvas.height !== scaledHeight) {
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;
    }
    if (ctx.resetTransform) ctx.resetTransform();
    ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, width, height);
    return { ctx, width, height };
}

function renderExpenseCategoryFallback(canvas, data, colors) {
    const meta = getCanvasContext(canvas);
    if (!meta) return;
    const { ctx, width, height } = meta;
    const total = data.reduce((sum, value) => sum + value, 0);
    if (total <= 0) return;

    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    let start = -Math.PI / 2;

    data.forEach((value, idx) => {
        const slice = (value / total) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, start, start + slice);
        ctx.closePath();
        ctx.fillStyle = colors[idx % colors.length];
        ctx.fill();
        start += slice;
    });

    const textColor = document.body.classList.contains('dark') ? '#e2e8f0' : '#334155';
    ctx.fillStyle = textColor;
    ctx.font = '600 16px "Segoe UI", Tahoma, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Total', cx, cy - 14);
    ctx.font = '700 18px "Segoe UI", Tahoma, sans-serif';
    ctx.fillText(formatCurrency(total), cx, cy + 14);
}

function renderIncomeExpenseFallback(canvas, labels, dataset) {
    const meta = getCanvasContext(canvas);
    if (!meta) return;
    const { ctx, width, height } = meta;
    const maxValue = Math.max(...dataset);
    if (maxValue <= 0) return;

    const padding = 32;
    const axisColor = document.body.classList.contains('dark') ? 'rgba(148, 163, 184, 0.4)' : 'rgba(100, 116, 139, 0.4)';
    const textColor = document.body.classList.contains('dark') ? '#e2e8f0' : '#1f2937';
    const fillColors = BAR_SERIES.map(series => series.fill);
    const strokeColors = BAR_SERIES.map(series => series.border);

    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding + 12, height - padding);
    ctx.stroke();

    const availableWidth = width - padding * 2;
    const barWidth = Math.min(120, availableWidth / (dataset.length * 1.8));
    const gap = (availableWidth - barWidth * dataset.length) / (dataset.length + 1);
    const chartHeight = height - padding * 2;

    dataset.forEach((value, idx) => {
        const barHeight = (value / maxValue) * chartHeight;
        const x = padding + gap * (idx + 1) + barWidth * idx;
        const y = height - padding - barHeight;

        ctx.fillStyle = fillColors[idx % fillColors.length];
        ctx.strokeStyle = strokeColors[idx % strokeColors.length];
        ctx.lineWidth = 2;
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, 10);
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.fillRect(x, y, barWidth, barHeight);
            ctx.strokeRect(x, y, barWidth, barHeight);
        }

        ctx.fillStyle = textColor;
        ctx.font = '600 14px "Segoe UI", Tahoma, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(labels[idx], x + barWidth / 2, height - padding + 18);
        ctx.font = '700 14px "Segoe UI", Tahoma, sans-serif';
        ctx.fillText(formatCurrency(value), x + barWidth / 2, y - 12);
    });
}

function getExpenseCategorySummary() {
    const summary = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, transaction) => {
            const key = transaction.category || 'Uncategorized';
            acc[key] = (acc[key] || 0) + transaction.amount;
            return acc;
        }, {});

    const labels = Object.keys(summary);
    const data = labels.map(label => summary[label]);
    return { labels, data };
}

function refreshExpenseCategoryChart() {
    const canvas = document.getElementById('expense-category-chart');
    if (!canvas) return;

    const { labels, data } = getExpenseCategorySummary();
    const hasData = labels.length > 0;
    const chartLabels = hasData ? labels : ['No expenses yet'];
    const chartData = hasData ? data : [0];
    const colors = hasData
        ? chartLabels.map((_, idx) => CHART_PALETTE[idx % CHART_PALETTE.length])
        : ['#d1d5db'];

    toggleChartEmptyState('expense-category-chart', !hasData);
    updateChartLegend('expense-category-chart', hasData ? chartLabels.map((label, idx) => ({
        label,
        color: colors[idx % colors.length],
        value: chartData[idx]
    })) : []);

    if (typeof Chart === 'undefined') {
        renderExpenseCategoryFallback(canvas, chartData, colors);
        return;
    }

    if (expenseByCategoryChart) {
        expenseByCategoryChart.data.labels = chartLabels;
        expenseByCategoryChart.data.datasets[0].data = chartData;
        expenseByCategoryChart.data.datasets[0].backgroundColor = colors;
        expenseByCategoryChart.options.plugins.legend.display = false;
        expenseByCategoryChart.options.plugins.tooltip.enabled = hasData;
        expenseByCategoryChart.update();
        return;
    }

    expenseByCategoryChart = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: chartLabels,
            datasets: [
                {
                    data: chartData,
                    backgroundColor: colors,
                    borderWidth: 0,
                    hoverOffset: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: hasData,
                    callbacks: {
                        label: context => {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            return `${label}: ${formatCurrency(value)}`;
                        }
                    }
                }
            }
        }
    });
}

function refreshIncomeExpenseChart() {
    const canvas = document.getElementById('income-expense-chart');
    if (!canvas) return;

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    const labels = ['Income', 'Expense'];
    const dataset = [totalIncome, totalExpense];
    const hasData = dataset.some(value => value > 0);

    toggleChartEmptyState('income-expense-chart', !hasData);
    updateChartLegend('income-expense-chart', hasData ? BAR_SERIES.map((series, idx) => ({
        label: series.label,
        color: series.fill,
        value: dataset[idx]
    })) : []);

    if (typeof Chart === 'undefined') {
        renderIncomeExpenseFallback(canvas, labels, dataset);
        return;
    }

    if (incomeExpenseChart) {
        incomeExpenseChart.data.datasets[0].data = dataset;
        incomeExpenseChart.update();
        return;
    }

    incomeExpenseChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                label: 'Amount',
                data: dataset,
                backgroundColor: BAR_SERIES.map(series => series.fill),
                borderColor: BAR_SERIES.map(series => series.border),
                borderWidth: 1,
                borderRadius: 10,
                maxBarThickness: 64
            }
        ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: context => `${context.label}: ${formatCurrency(context.parsed.y)}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => formatCurrency(value)
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.2)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function updateCharts() {
    refreshExpenseCategoryChart();
    refreshIncomeExpenseChart();
}

function transactionsToCSV(rows) {
    const header = ['ID', 'Type', 'Date', 'Description', 'Category', 'Amount'];
    const lines = [header.join(',')];
    rows.forEach(row => {
        const cells = [
            row.id,
            row.type,
            row.date || '',
            row.description ? row.description.replace(/"/g, '""') : '',
            row.category || '',
            row.amount
        ];
        const escaped = cells.map(value => {
            const cell = `${value ?? ''}`;
            return /[",\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
        });
        lines.push(escaped.join(','));
    });
    return lines.join('\n');
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function handleExportCSV() {
    if (!transactions.length) {
        showToast('Add a transaction before exporting.', 'warn');
        return;
    }
    const csv = transactionsToCSV(transactions);
    const timestamp = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0];
    downloadCSV(csv, `finance-transactions-${timestamp}.csv`);
    showToast('Transactions exported as CSV.', 'success');
}


/**
 * Adds a single transaction object to the DOM list.
 */
function addTransactionToDOM(transaction) {
    const typeClass = transaction.type === 'income' ? 'income-item' : 'expense-item';
    const iconClass = transaction.type === 'income' ? 'income-icon' : 'expense-icon';
    const iconTag = transaction.type === 'income' ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
    const amountSign = transaction.type === 'income' ? '+' : '-';
    const listItem = document.createElement('li');
    listItem.classList.add('transaction-item', typeClass);

    const safeDescription = escapeHtml(transaction.description);
    const safeCategory = escapeHtml(transaction.category);
    const safeDate = escapeHtml(transaction.date);

    listItem.innerHTML = `
        <div class="transaction-header">
            <div class="transaction-info">
                <span class="icon-indicator ${iconClass}"><i class="fas ${iconTag}"></i></span>
                <div class="transaction-overview">
                    <span class="transaction-description">${safeDescription}</span>
                </div>
            </div>
            <div class="transaction-meta">
                <span class="transaction-amount">${amountSign}${formatCurrency(transaction.amount)}</span>
                <button class="transaction-toggle" type="button" aria-expanded="false" aria-label="Toggle details for ${safeDescription || 'transaction'}">
                    <i class="fas fa-chevron-down"></i>
                </button>
            </div>
        </div>
        <div class="transaction-body">
            <div class="transaction-extra">
                <div class="transaction-extra-item">
                    <span class="extra-label">Category</span>
                    <span class="extra-value">${safeCategory}</span>
                </div>
                <div class="transaction-extra-item">
                    <span class="extra-label">Date</span>
                    <span class="extra-value">${safeDate}</span>
                </div>
            </div>
            <div class="transaction-actions">
                <button class="action-btn edit-btn" data-id="${transaction.id}" title="Edit transaction" aria-label="Edit transaction">
                    <i class="fas fa-pen-to-square"></i><span>Edit</span>
                </button>
                <button class="action-btn delete-btn" data-id="${transaction.id}" title="Delete transaction" aria-label="Delete transaction">
                    <i class="fas fa-trash"></i><span>Delete</span>
                </button>
            </div>
        </div>
    `;

    const toggleButton = listItem.querySelector('.transaction-toggle');
    const expandByDefault = desktopCardsQuery.matches;
    if (expandByDefault) {
        listItem.classList.add('expanded');
        if (toggleButton) {
            toggleButton.setAttribute('aria-expanded', 'true');
        }
    }

    transactionList.prepend(listItem);
}


/**
 * Handles the form submission to add a new transaction.
 */
function addTransaction(event) {
    event.preventDefault();
    const type = document.querySelector('input[name="type"]:checked').value;
    const date = transactionDate.value;
    const description = transactionDescription.value;
    const category = transactionCategory.value;
    const amount = parseFloat(transactionAmount.value);
    if (description.trim() === '' || category === '' || isNaN(amount) || amount <= 0) {
        showToast('Please fill out all fields with valid values.', 'error');
        return;
    }
    const transaction = {
        id: generateID(), type: type, date: date, description: description, category: category, amount: Math.abs(amount)
    };
    transactions.push(transaction);
    updateLocalStorage();
    transactionForm.reset();
    init();
    showToast('New transaction added.', 'success');
}

/**
 * Handles clicks within the transaction list (for deleting items).
 */
function handleTransactionClick(event) {
    const toggleButton = event.target.closest('.transaction-toggle');
    if (toggleButton) {
        const item = toggleButton.closest('.transaction-item');
        if (item) {
            const expanded = item.classList.toggle('expanded');
            toggleButton.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        }
        return;
    }
    const deleteButton = event.target.closest('.delete-btn');
    if (deleteButton) {
        const id = parseInt(deleteButton.dataset.id);
        const ok = confirm('Are you sure you want to delete this transaction?');
        if (ok) removeTransaction(id);
        return;
    }
    const editButton = event.target.closest('.edit-btn');
    if (editButton) {
        const id = parseInt(editButton.dataset.id);
        startEditTransaction(id);
    }
}

/**
 * Removes a transaction by its ID.
 */
function removeTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    updateLocalStorage();
    init(); // init calls all necessary update functions
    showToast('Transaction deleted.', 'info');
}

// ==========================================================================
// 3.x Toast notifications
// ==========================================================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warn' ? 'fa-exclamation-triangle' : 'fa-info-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 250);
    }, 2800);
}

/**
 * Initializes the application.
 */
function init() {
    applyCurrencyToBudgetInputs();
    renderTransactions();
    updateSummary();
    loadBudgets();
    updateBudgetProgress();
    updateCharts();
}

// ==========================================================================
// 3. Rendering with filter/sort
// ==========================================================================
function getFilteredSortedTransactions() {
    const q = (searchInput && searchInput.value || '').trim().toLowerCase();
    const type = (filterType && filterType.value) || 'all';
    const category = (filterCategory && filterCategory.value) || 'all';
    const sortBy = (sortBySelect && sortBySelect.value) || 'date';
    const dir = (sortDirSelect && sortDirSelect.value) || 'desc';

    let list = [...transactions];

    if (q) {
        list = list.filter(t => (t.description || '').toLowerCase().includes(q));
    }
    if (type !== 'all') {
        list = list.filter(t => t.type === type);
    }
    if (category !== 'all') {
        list = list.filter(t => t.category === category);
    }

    const factor = dir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
        if (sortBy === 'amount') {
            const va = a.amount || 0;
            const vb = b.amount || 0;
            return (va - vb) * factor;
        }
        // default: date
        const va = a.date || '';
        const vb = b.date || '';
        return (va < vb ? -1 : va > vb ? 1 : 0) * factor;
    });

    return list;
}

function renderTransactions() {
    transactionList.innerHTML = '';
    const list = getFilteredSortedTransactions();
    list.forEach(addTransactionToDOM);
    syncTransactionCardExpansion(desktopCardsQuery.matches);
}

function syncTransactionCardExpansion(shouldExpand) {
    if (!transactionList) return;
    const items = transactionList.querySelectorAll('.transaction-item');
    items.forEach(item => {
        const toggle = item.querySelector('.transaction-toggle');
        if (!toggle) return;
        if (shouldExpand) {
            item.classList.add('expanded');
            toggle.setAttribute('aria-expanded', 'true');
        } else {
            item.classList.remove('expanded');
            toggle.setAttribute('aria-expanded', 'false');
        }
    });
}

/**
 * Enter edit mode for a specific transaction: populate form and toggle buttons
 */
function startEditTransaction(id) {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    openEditModal(tx);
}

function openEditModal(transaction) {
    if (!editModal || !editForm) return;
    editingId = transaction.id;
    lastFocusedElement = document.activeElement;

    if (editTypeIncome) editTypeIncome.checked = transaction.type === 'income';
    if (editTypeExpense) editTypeExpense.checked = transaction.type !== 'income';

    if (editDate) editDate.value = transaction.date || '';
    if (editCategory) {
        const existingOption = Array.from(editCategory.options).some(opt => opt.value === transaction.category);
        if (!existingOption && transaction.category) {
            const opt = document.createElement('option');
            opt.value = transaction.category;
            opt.textContent = transaction.category;
            editCategory.appendChild(opt);
        }
        editCategory.value = transaction.category || '';
    }
    if (editDescription) editDescription.value = transaction.description || '';
    if (editAmount) editAmount.value = transaction.amount != null ? transaction.amount : '';

    editModal.classList.add('active');
    editModal.setAttribute('aria-hidden', 'false');

    requestAnimationFrame(() => {
        if (editDescription) {
            editDescription.focus();
        }
    });
}

function closeEditModal() {
    if (!editModal || !editForm) return;
    editModal.classList.remove('active');
    editModal.setAttribute('aria-hidden', 'true');
    editForm.reset();
    editingId = null;
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
    }
    lastFocusedElement = null;
}

function handleEditFormSubmit(event) {
    event.preventDefault();
    if (editingId === null) {
        closeEditModal();
        return;
    }

    const type = editTypeIncome && editTypeIncome.checked ? 'income' : 'expense';
    const date = editDate ? editDate.value : '';
    const description = (editDescription && editDescription.value || '').trim();
    const category = editCategory ? editCategory.value : '';
    const amountValue = editAmount ? parseFloat(editAmount.value) : NaN;

    if (!description || !category || isNaN(amountValue) || amountValue <= 0) {
        showToast('Please enter valid values before saving.', 'error');
        return;
    }

    const idx = transactions.findIndex(t => t.id === editingId);
    if (idx === -1) {
        closeEditModal();
        return;
    }

    transactions[idx] = {
        ...transactions[idx],
        type,
        date,
        description,
        category,
        amount: Math.abs(amountValue)
    };

    updateLocalStorage();
    closeEditModal();
    init();
    showToast('Transaction updated.', 'success');
}

/**
 * Generates a random unique ID.
 * @returns {number} A random number.
 */
function generateID() {
    return Math.floor(Math.random() * 1000000);
}


// ==========================================================================
// 4. Event Listeners and Initial Call
// ==========================================================================
transactionForm.addEventListener('submit', addTransaction);
budgetForm.addEventListener('submit', saveBudgets);
transactionList.addEventListener('click', handleTransactionClick);
// Filter/sort listeners
if (searchInput) searchInput.addEventListener('input', renderTransactions);
if (filterType) filterType.addEventListener('change', renderTransactions);
if (filterCategory) filterCategory.addEventListener('change', renderTransactions);
if (sortBySelect) sortBySelect.addEventListener('change', renderTransactions);
if (sortDirSelect) sortDirSelect.addEventListener('change', renderTransactions);

if (currencySelect) {
    currencySelect.value = currentCurrency;
    currencySelect.addEventListener('change', event => {
        setCurrency(event.target.value);
    });
} else {
    // Ensure summary still reflects persisted currency even if selector missing
    currencyFormatter = createCurrencyFormatter(currentCurrency);
}

if (typeof desktopCardsQuery.addEventListener === 'function') {
    desktopCardsQuery.addEventListener('change', event => {
        syncTransactionCardExpansion(event.matches);
    });
} else if (typeof desktopCardsQuery.addListener === 'function') {
    desktopCardsQuery.addListener(event => {
        syncTransactionCardExpansion(event.matches);
    });
}

if (editForm) {
    editForm.addEventListener('submit', handleEditFormSubmit);
}

if (modalDismissTriggers && modalDismissTriggers.length) {
    modalDismissTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            closeEditModal();
        });
    });
}

if (exportButton) {
    exportButton.addEventListener('click', handleExportCSV);
}

if (editModal) {
    editModal.addEventListener('click', event => {
        if (event.target === editModal) {
            closeEditModal();
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && editModal.classList.contains('active')) {
            closeEditModal();
        }
    });
}

init();

// ==========================================================================
// 5. Theme (Dark/Light) Toggle with persistence
// ==========================================================================
(function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
        document.body.classList.add('dark');
        updateThemeToggleIcon();
        updateCharts();
    }
})();

function updateThemeToggleIcon() {
    if (!themeToggle) return;
    const i = themeToggle.querySelector('i');
    if (!i) return;
    if (document.body.classList.contains('dark')) {
        i.classList.remove('fa-moon');
        i.classList.add('fa-sun');
        themeToggle.title = 'Switch to light mode';
        themeToggle.setAttribute('aria-label', 'Switch to light mode');
    } else {
        i.classList.remove('fa-sun');
        i.classList.add('fa-moon');
        themeToggle.title = 'Switch to dark mode';
        themeToggle.setAttribute('aria-label', 'Switch to dark mode');
    }
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateThemeToggleIcon();
        updateCharts();
    });
}
