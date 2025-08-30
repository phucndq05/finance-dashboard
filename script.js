// ==========================================================================
// 1. Element Selections
// ==========================================================================
const transactionForm = document.getElementById('transaction-form');
const transactionDate = document.getElementById('date');
const transactionDescription = document.getElementById('description');
const transactionAmount = document.getElementById('amount');
const transactionList = document.getElementById('transaction-list');
// ... (các element khác sẽ dùng sau)


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
 * Adds a single transaction object to the DOM list.
 * @param {object} transaction The transaction object to display.
 */
function addTransactionToDOM(transaction) {
    // 1. Determine if it's an income or expense for styling
    const typeClass = transaction.type === 'income' ? 'income-item' : 'expense-item';
    const iconClass = transaction.type === 'income' ? 'income-icon' : 'expense-icon';
    const iconTag = transaction.type === 'income' ? 'fa-plus-circle' : 'fa-minus-circle';
    const amountSign = transaction.type === 'income' ? '+' : '-';

    // 2. Create the new list item element
    const listItem = document.createElement('li');

    // 3. Add the necessary classes
    listItem.classList.add('transaction-item', typeClass);

    // 4. Set the inner HTML with the transaction data
    // We use template literals (`) to easily embed variables
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

    // 5. Append the new item to the transaction list in the DOM
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

    // Add the new transaction to our global array
    transactions.push(transaction);

    // Add the new transaction to the DOM
    addTransactionToDOM(transaction);

    // We will update balance, income, expense here later
    // updateSummary();

    // Clear the form fields
    transactionForm.reset();
}


/**
 * Initializes the application.
 */
function init() {
    // Clear the list first to avoid duplicates
    transactionList.innerHTML = '';
    // Loop through our initial transactions and display them
    transactions.forEach(addTransactionToDOM);
    // updateSummary(); // We will activate this later
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

// Run the init function when the page loads
init();