const display = document.getElementById('display');
const buttons = document.querySelectorAll('.button');
const clearButton = document.getElementById('clear');
const equalsButton = document.getElementById('equals');

// --- Calculator State Variables ---
let currentInput = '0'; // Stores the number currently being entered or displayed
let operator = null; // Stores the selected arithmetic operator (+, -, *, /)
let previousInput = null; // Stores the first operand of an operation
let waitingForSecondOperand = false; // Flag to indicate if the next digit input should start a new number

/**
 * --- updateDisplay Function ---
 * Updates the calculator's display screen with the given value.
 * Handles rounding for numerical results to prevent floating-point inaccuracies.
 * @param {string|number} value - The value to be shown on the display.
 */
function updateDisplay(value) {
    if (typeof value === 'number') {
        // Round numbers to a reasonable precision (e.g., 10 decimal places)
        // to avoid issues like 0.1 + 0.2 showing 0.30000000000000004
        display.textContent = parseFloat(value.toFixed(10));
    } else {
        display.textContent = value;
    }
}

/**
 * --- inputNumber Function ---
 * Handles input when a number button (0-9) or decimal point (.) is clicked/pressed.
 * Manages appending digits or starting a new number based on calculator state.
 * @param {string} number - The digit or decimal point pressed.
 */
function inputNumber(number) {
    // If the display currently shows an error, pressing a number clears it and starts fresh
    if (currentInput.startsWith('Error')) {
        resetCalculator();
    }

    if (waitingForSecondOperand) {
        // If waiting for the second operand, replace the display with the new number
        currentInput = number;
        waitingForSecondOperand = false;
    } else {
        // If current input is '0' and a non-decimal number is pressed, replace '0'.
        // Otherwise, append the number to the current input.
        currentInput = currentInput === '0' && number !== '.' ? number : currentInput + number;
    }
    updateDisplay(currentInput);
}

/**
 * --- handleOperator Function ---
 * Processes an operator button click (+, -, ×, ÷).
 * Manages chaining operations (e.g., 5 + 3 + 2) and updating the operator.
 * @param {string} nextOperator - The operator that was pressed.
 */
function handleOperator(nextOperator) {
    // If the display currently shows an error, clear it before processing operator
    if (currentInput.startsWith('Error')) {
        resetCalculator();
    }

    const inputValue = parseFloat(currentInput); // Convert current display value to a number

    // If an operator was already selected and we're waiting for the second operand,
    // it means the user pressed an operator consecutively (e.g., 5 + *).
    // In this case, just update the operator and return.
    if (operator && waitingForSecondOperand) {
        operator = nextOperator;
        return;
    }

    // If there's no previous input, store the current input as the first operand.
    if (previousInput === null) {
        previousInput = inputValue;
    } else if (operator) {
        // If there's a previous input and an operator, perform the pending calculation.
        const result = calculate(previousInput, inputValue, operator);

        // If the calculation resulted in an error (e.g., division by zero),
        // display the error and reset the calculator state.
        if (typeof result === 'string' && result.startsWith('Error')) {
            currentInput = result;
            updateDisplay(currentInput);
            previousInput = null;
            operator = null;
            waitingForSecondOperand = false;
            return;
        }

        // Update current input with the result and display it.
        currentInput = String(result);
        updateDisplay(currentInput);
        // Set the result as the new previous input for chained operations (e.g., 5 + 3 = 8 + 2)
        previousInput = result;
    }

    // Set the flag to true, indicating that the next number input will be the second operand.
    waitingForSecondOperand = true;
    // Store the newly selected operator.
    operator = nextOperator;
}

/**
 * --- calculate Function ---
 * Performs the actual arithmetic operation based on the given operands and operator.
 * Handles division by zero.
 * @param {number} firstOperand - The first number in the operation.
 * @param {number} secondOperand - The second number in the operation.
 * @param {string} op - The operator symbol (+, -, ×, ÷, *, /).
 * @returns {number|string} The result of the calculation or an error message if division by zero occurs.
 */
function calculate(firstOperand, secondOperand, op) {
    switch (op) {
        case '+':
            return firstOperand + secondOperand;
        case '−': // Changed from '&minus;' to actual minus sign character
        case '-':       // Keyboard hyphen-minus
            return firstOperand - secondOperand;
        case '×': // Changed from '&times;' to actual multiplication sign character
        case '*':       // Keyboard asterisk
            return firstOperand * secondOperand;
        case '÷': // Changed from '&divide;' to actual division sign character
        case '/':        // Keyboard slash
            if (secondOperand === 0) {
                return 'Error: Div by 0'; // Return an error string for division by zero
            }
            return firstOperand / secondOperand;
        default:
            // This case should ideally not be reached with the current logic,
            // but as a fallback, return the second operand.
            return secondOperand;
    }
}

/**
 * --- resetCalculator Function ---
 * Resets all calculator state variables to their initial values, effectively clearing the calculator.
 */
function resetCalculator() {
    currentInput = '0';
    operator = null;
    previousInput = null;
    waitingForSecondOperand = false;
    updateDisplay(currentInput);
}

// --- Event Listeners for Buttons ---
// Iterate over all buttons and attach a click event listener to each.
buttons.forEach(button => {
    button.addEventListener('click', (event) => {
        const { value } = event.target.dataset; // Get the 'data-value' attribute from the clicked button

        // Handle the 'AC' (All Clear) button click
        if (event.target.id === 'clear') {
            resetCalculator();
            return; // Stop further processing for this click
        }

        // Handle the '=' (Equals) button click
        if (event.target.id === 'equals') {
            // Only perform calculation if an operator has been set
            if (operator) {
                // If the display shows an error, clear it before attempting calculation
                if (currentInput.startsWith('Error')) {
                    resetCalculator();
                    return;
                }

                const inputValue = parseFloat(currentInput);
                let finalSecondOperand = inputValue;

                // This handles cases like '5 + =' where the second operand should default
                // to the first operand (effectively '5 + 5').
                if (waitingForSecondOperand) {
                    finalSecondOperand = previousInput;
                }

                // Perform the calculation
                const result = calculate(previousInput, finalSecondOperand, operator);

                // If calculation resulted in an error, display it and reset state
                if (typeof result === 'string' && result.startsWith('Error')) {
                    currentInput = result;
                    updateDisplay(currentInput);
                    previousInput = null;
                    operator = null;
                    waitingForSecondOperand = false;
                    return;
                }

                // Update current input, display the result, and prepare for chaining.
                currentInput = String(result);
                updateDisplay(currentInput);
                previousInput = result; // Store result as new previous for chained equals (e.g., 8 = = = ...)
                operator = null; // Clear the operator after a successful calculation
                waitingForSecondOperand = true; // Set flag to true for a new calculation or continued operation
            }
            return; // Stop further processing for this click
        }

        // Handle clicks on operator buttons
        if (event.target.classList.contains('operator')) {
            handleOperator(value);
            return; // Stop further processing for this click
        }

        // Handle clicks on number and decimal buttons
        if (value !== undefined) {
             // Prevent multiple decimal points in the current input
            if (value === '.' && currentInput.includes('.')) {
                return;
            }
            inputNumber(value);
        }
    });
});

// --- Bonus: Keyboard Support ---
// Listen for keyboard key presses on the entire document.
document.addEventListener('keydown', (event) => {
    const key = event.key; // Get the pressed key

    // Handle number keys (0-9) and the decimal point (.)
    if (/[0-9]|\./.test(key)) {
        // Prevent multiple decimal points from being entered
        if (key === '.' && currentInput.includes('.')) {
            return;
        }
        inputNumber(key);
    }
    // Handle operator keys (+, -, *, /)
    else if (['+', '-', '*', '/'].includes(key)) {
        // Map keyboard symbols to their HTML entity equivalents if necessary for internal logic consistency
        let displayOperator = key;
        if (key === '/') displayOperator = '÷'; // Changed from '&divide;'
        if (key === '*') displayOperator = '×'; // Changed from '&times;'
        if (key === '-') displayOperator = '−'; // Changed from '&minus;'
        handleOperator(displayOperator);
    }
    // Handle the 'Enter' key for performing calculation (equivalent to '=')
    else if (key === 'Enter') {
        event.preventDefault(); // Prevent default browser actions (like form submission)
        equalsButton.click(); // Programmatically click the equals button
    }
    // Handle the 'Escape' key for clearing the calculator ('AC')
    else if (key === 'Escape') {
        resetCalculator();
    }
});
