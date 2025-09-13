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
const cancelEditBtn = document.getElementById('cancel-edit');


// ==========================================================================
// 2. Global State (Our "Database")
// ==========================================================================
const savedTransactions = JSON.parse(localStorage.getItem('transactions'));
let transactions = savedTransactions || [];
const savedBudgets = JSON.parse(localStorage.getItem('budgets'));
let budgets = savedBudgets || {};
let editingId = null; // Track currently edited transaction id

// ==========================================================================
// 2.1 Formatting helpers (locale currency)
// ==========================================================================
const LOCALE = navigator.language || 'en-US';
const CURRENCY = 'USD';
const currencyFormatter = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY });
function formatCurrency(amount) {
    return currencyFormatter.format(amount || 0);
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
    const iconTag = transaction.type === 'income' ? 'fa-plus-circle' : 'fa-minus-circle';
    const amountSign = transaction.type === 'income' ? '+' : '-';
    const listItem = document.createElement('li');
    listItem.classList.add('transaction-item', typeClass);

    listItem.innerHTML = `
        <div class="transaction-info">
            <span class="icon-indicator ${iconClass}"><i class="fas ${iconTag}"></i></span>
            <span class="transaction-details">
                <span class="transaction-description">${transaction.description}</span>
                <small class="transaction-category">${transaction.category}</small>
                <small class="transaction-date">${transaction.date}</small>
            </span>
        </div>
        <div class="transaction-actions">
            <span class="transaction-amount">${amountSign}${formatCurrency(transaction.amount)}</span>
            <button class="edit-btn" data-id="${transaction.id}" title="Edit">
                <i class="fas fa-edit"></i>
            </button>
            <button class="delete-btn" data-id="${transaction.id}" title="Delete">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;
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
    if (editingId !== null) {
        // Update existing transaction
        const idx = transactions.findIndex(t => t.id === editingId);
        if (idx !== -1) {
            transactions[idx] = {
                id: editingId,
                type: type,
                date: date,
                description: description,
                category: category,
                amount: Math.abs(amount)
            };
        }
        updateLocalStorage();
        exitEditMode();
        init(); // re-render list and summaries
        showToast('Transaction changes saved.', 'success');
    } else {
        // Create new transaction
        const transaction = {
            id: generateID(), type: type, date: date, description: description, category: category, amount: Math.abs(amount)
        };
        transactions.push(transaction);
        addTransactionToDOM(transaction);
        updateSummary();
        updateBudgetProgress();
        updateLocalStorage();
        transactionForm.reset();
        showToast('New transaction added.', 'success');
    }
}

/**
 * Handles clicks within the transaction list (for deleting items).
 */
function handleTransactionClick(event) {
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
    transactionList.innerHTML = '';
    transactions.forEach(addTransactionToDOM);
    updateSummary();
    loadBudgets();
    updateBudgetProgress();
}

/**
 * Enter edit mode for a specific transaction: populate form and toggle buttons
 */
function startEditTransaction(id) {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    editingId = id;
    // Populate the form with existing values
    const incomeRadio = document.getElementById('type-income');
    const expenseRadio = document.getElementById('type-expense');
    if (tx.type === 'income') {
        incomeRadio.checked = true;
    } else {
        expenseRadio.checked = true;
    }
    transactionDate.value = tx.date || '';
    transactionDescription.value = tx.description || '';
    transactionCategory.value = tx.category || '';
    transactionAmount.value = tx.amount != null ? tx.amount : '';
    // Update submit/cancel controls
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
    if (cancelEditBtn) cancelEditBtn.style.display = 'inline-block';
    transactionDescription.focus();
}

/**
 * Leave edit mode and reset form and controls
 */
function exitEditMode() {
    editingId = null;
    transactionForm.reset();
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Add Transaction';
    if (cancelEditBtn) cancelEditBtn.style.display = 'none';
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
if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', exitEditMode);
}

init();
