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
    });
}
