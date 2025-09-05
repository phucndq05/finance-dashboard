// ==========================================================================
// 1. Element Selections
// ==========================================================================
// --- Form Elements ---
const transactionForm = document.getElementById('transaction-form');
const transactionDate = document.getElementById('date');
const transactionDescription = document.getElementById('description');
const transactionCategory = document.getElementById('category');
const transactionAmount = document.getElementById('amount');

// --- Budget Form Elements ---
const budgetForm = document.getElementById('budget-form');
const budgetInputs = document.querySelectorAll('#budget-form input'); // Get all budget inputs

// --- Transaction List ---
const transactionList = document.getElementById('transaction-list');

// --- Summary Card Displays ---
const balanceDisplay = document.querySelector('#balance p');
const incomeDisplay = document.querySelector('#income p');
const expenseDisplay = document.querySelector('#expense p');


// ==========================================================================
// 2. Global State (Our "Database")
// ==========================================================================
const savedTransactions = JSON.parse(localStorage.getItem('transactions'));
let transactions = savedTransactions || [];

// NEW: Load budgets from localStorage
const savedBudgets = JSON.parse(localStorage.getItem('budgets'));
let budgets = savedBudgets || {};


// ==========================================================================
// 3. Functions
// ==========================================================================

/**
 * Saves the current transactions array to local storage.
 */
function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('budgets', JSON.stringify(budgets)); // Also save budgets
}

/**
 * (IMPROVED) Handles the submission of the budget form.
 * @param {Event} event The submit event object.
 */
function saveBudgets(event) {
    event.preventDefault(); // Prevent page reload
    
    // Loop through each input field in the budget form
    budgetInputs.forEach(input => {
        const category = input.dataset.category;
        const value = input.value; // Get the value as a string

        // Only process if a category attribute exists
        if (category) {
            // If the user entered a valid number, save it
            if (value && !isNaN(parseFloat(value)) && parseFloat(value) >= 0) {
                budgets[category] = parseFloat(value);
            } else {
                // If the input is empty or invalid, remove the budget for that category
                delete budgets[category];
            }
        }
    });

    console.log('Saving budgets:', budgets); // DEBUG: Check what is being saved
    updateLocalStorage(); // Save the updated budgets object
    alert('Budgets saved successfully!');
}

/**
 * (IMPROVED) Loads budget data and populates the form fields.
 */
function loadBudgets() {
    budgetInputs.forEach(input => {
        const category = input.dataset.category;
        // Check if a budget for this category exists in our budgets object
        if (category && budgets[category] !== undefined) {
            input.value = budgets[category];
        } else {
            // If not, ensure the input is clear
            input.value = '';
        }
    });
}

/**
 * Calculates total income, total expense, and balance, then updates the DOM.
 */
function updateSummary() {
    // ... function content remains the same ...
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    balanceDisplay.innerText = `$${balance.toFixed(2)}`;
    incomeDisplay.innerText = `+$${totalIncome.toFixed(2)}`;
    expenseDisplay.innerText = `-$${totalExpense.toFixed(2)}`;
}


/**
 * Adds a single transaction object to the DOM list.
 */
function addTransactionToDOM(transaction) {
    // ... function content remains the same ...
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
            <span class="transaction-amount">${amountSign}$${transaction.amount.toFixed(2)}</span>
            <button class="delete-btn" data-id="${transaction.id}">
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
    // ... function content remains the same ...
    event.preventDefault();

    const type = document.querySelector('input[name="type"]:checked').value;
    const date = transactionDate.value;
    const description = transactionDescription.value;
    const category = transactionCategory.value;
    const amount = parseFloat(transactionAmount.value);

    if (description.trim() === '' || category === '' || isNaN(amount) || amount <= 0) {
        alert('Please fill out all fields with valid values.');
        return;
    }

    const transaction = {
        id: generateID(),
        type: type,
        date: date,
        description: description,
        category: category,
        amount: Math.abs(amount)
    };

    transactions.push(transaction);
    addTransactionToDOM(transaction);
    updateSummary();
    updateLocalStorage();

    transactionForm.reset();
}

/**
 * Handles clicks within the transaction list (for deleting items).
 */
function handleTransactionClick(event) {
    // ... function content remains the same ...
    const deleteButton = event.target.closest('.delete-btn');
    if (deleteButton) {
        const id = parseInt(deleteButton.dataset.id);
        removeTransaction(id);
    }
}

/**
 * Removes a transaction by its ID.
 */
function removeTransaction(id) {
    // ... function content remains the same ...
    transactions = transactions.filter(transaction => transaction.id !== id);
    updateLocalStorage();
    init();
}

/**
 * Initializes the application.
 */
function init() {
    transactionList.innerHTML = '';
    transactions.forEach(addTransactionToDOM);
    updateSummary();
    loadBudgets(); // <-- NEW: Load budgets when the app starts
}


/**
 * Generates a random unique ID.
 * @returns {number} A random number.
 */
function generateID() {
    // ... function content remains the same ...
    return Math.floor(Math.random() * 1000000);
}


// ==========================================================================
// 4. Event Listeners and Initial Call
// ==========================================================================
transactionForm.addEventListener('submit', addTransaction);
budgetForm.addEventListener('submit', saveBudgets); // <-- NEW: Listen for budget form submission
transactionList.addEventListener('click', handleTransactionClick);

init();