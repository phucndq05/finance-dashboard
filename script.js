// ==========================================================================
// 1. Element Selections
// ==========================================================================
const transactionForm = document.getElementById('transaction-form');
const transactionDate = document.getElementById('date');
const transactionDescription = document.getElementById('description');
const transactionAmount = document.getElementById('amount');
const transactionList = document.getElementById('transaction-list');

// --- Summary Card Displays ---
const balanceDisplay = document.querySelector('#balance p');
const incomeDisplay = document.querySelector('#income p');
const expenseDisplay = document.querySelector('#expense p');


// ==========================================================================
// 2. Global State (Our "Database")
// ==========================================================================
let transactions = [
    // Dummy data to start with
    { id: 1, type: 'expense', date: '2025-08-28', description: 'Lunch with colleagues', amount: 15.00 },
    { id: 2, type: 'income', date: '2025-08-27', description: 'Monthly Salary', amount: 2000.00 }
];


// ==========================================================================
// 3. Functions
// ==========================================================================

/**
 * Calculates total income, total expense, and balance, then updates the DOM.
 */
function updateSummary() {
    // 1. Get an array of all amounts from the transactions
    const amounts = transactions.map(transaction => transaction.amount);

    // 2. Calculate total income
    const totalIncome = amounts
        .filter((amount, index) => transactions[index].type === 'income')
        .reduce((sum, amount) => sum + amount, 0);

    // 3. Calculate total expense
    const totalExpense = amounts
        .filter((amount, index) => transactions[index].type === 'expense')
        .reduce((sum, amount) => sum + amount, 0);

    // 4. Calculate the balance
    const balance = totalIncome - totalExpense;

    // 5. Update the DOM with the new values, formatted as currency
    balanceDisplay.innerText = `$${balance.toFixed(2)}`;
    incomeDisplay.innerText = `+$${totalIncome.toFixed(2)}`;
    expenseDisplay.innerText = `-$${totalExpense.toFixed(2)}`;
}


/**
 * Adds a single transaction object to the DOM list.
 * @param {object} transaction The transaction object to display.
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
                <small class="transaction-date">${transaction.date}</small>
            </span>
        </div>
        <span class="transaction-amount">${amountSign}$${transaction.amount.toFixed(2)}</span>
    `;
    transactionList.prepend(listItem);
}


/**
 * Handles the form submission to add a new transaction.
 * @param {Event} event The event object from the form submission.
 */
function addTransaction(event) {
    event.preventDefault();

    const type = document.querySelector('input[name="type"]:checked').value;
    const date = transactionDate.value;
    const description = transactionDescription.value;
    const amount = parseFloat(transactionAmount.value);

    if (description.trim() === '' || isNaN(amount) || amount <= 0) {
        alert('Please enter a valid description and a positive amount.');
        return;
    }

    const transaction = {
        id: generateID(),
        type: type,
        date: date,
        description: description,
        amount: Math.abs(amount)
    };

    transactions.push(transaction);
    addTransactionToDOM(transaction);
    updateSummary(); // <-- UPDATE THE SUMMARY AFTER ADDING

    transactionForm.reset();
}


/**
 * Initializes the application.
 */
function init() {
    transactionList.innerHTML = '';
    transactions.forEach(addTransactionToDOM);
    updateSummary(); // <-- UPDATE THE SUMMARY ON PAGE LOAD
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

init();