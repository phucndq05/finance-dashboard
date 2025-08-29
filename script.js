// ==========================================================================
// 1. Element Selections
// ==========================================================================

// --- Form Elements ---
const transactionForm = document.getElementById('transaction-form');
const transactionType = document.querySelector('input[name="type"]:checked'); // This needs to be read at submission time
const transactionDate = document.getElementById('date');
const transactionDescription = document.getElementById('description');
const transactionAmount = document.getElementById('amount');

// --- Transaction List ---
const transactionList = document.getElementById('transaction-list');

// --- Summary Cards ---
const balanceDisplay = document.querySelector('#balance p');
const incomeDisplay = document.querySelector('#income p');
const expenseDisplay = document.querySelector('#expense p');


// A simple console log to confirm the script is loaded
console.log("Script loaded. Elements selected.");

// ==========================================================================
// 2. Event Listeners
// ==========================================================================
transactionForm.addEventListener('submit', addTransaction);


// ==========================================================================
// 3. Functions
// ==========================================================================

/**
 * Handles the form submission to add a new transaction.
 * @param {Event} event The event object from the form submission.
 */
function addTransaction(event) {
    // 1. Stop the form from submitting and reloading the page
    event.preventDefault();

    // 2. Get the values from the form inputs
    const type = document.querySelector('input[name="type"]:checked').value;
    const date = transactionDate.value;
    const description = transactionDescription.value;
    const amount = parseFloat(transactionAmount.value);

    // 3. Basic validation
    if (description.trim() === '' || isNaN(amount) || amount === 0) {
        alert('Please enter a valid description and amount.');
        return; // Stop the function from running further
    }

    // 4. Create a transaction object to hold the data
    const transaction = {
        id: generateID(), // A unique ID for the transaction
        type: type,
        date: date,
        description: description,
        amount: Math.abs(amount) // Store amount as a positive number
    };

    // 5. For now, just log the transaction object to the console
    console.log('New Transaction Added:', transaction);

    // After adding, we should clear the form fields for the next entry
    transactionForm.reset();
}

/**
 * Generates a random unique ID.
 * In a real app, this would be handled by a database.
 * @returns {number} A random number.
 */
function generateID() {
    return Math.floor(Math.random() * 1000000);
}