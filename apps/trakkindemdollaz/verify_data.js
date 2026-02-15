const fs = require('fs');
const path = './2025 WELLS.csv';

// Specific categories to check from the screenshot
const targetCategories = {
    'Rent': { expectedAmount: 28049.88, expectedCount: 24 },
    'Court': { expectedAmount: 17335.87, expectedCount: 14 },
    'Food': { expectedAmount: 11380.22, expectedCount: 359 },
    'Car': { expectedAmount: 5625.70, expectedCount: 90 },
};

try {
    const data = fs.readFileSync(path, 'utf8');
    const lines = data.split('\n').filter(l => l.trim());
    
    // Structure: DATE, INCOME, EXPENSE, DESCRIPTION, ACCOUNT, CATEGORY
    // Note: Line 3 is header. Data starts line 4.
    
    const sums = {};
    const counts = {};

    let startIndex = 0;
    // Find header line
    for(let i=0; i<lines.length; i++) {
        if(lines[i].includes('DATE,INCOME,EXPENSE')) {
            startIndex = i + 1;
            break;
        }
    }

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i];
        // CSV parsing can be tricky with quoted strings containing commas. 
        // Simple regex to match proper CSV tokens
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g); 
        // Actually a better simple splitter that handles quotes is needed or manual parsing.
        // Let's use a simple regex split for this specific file format if possible, 
        // but looking at "MOUNTAIN AMERICA PAMT...", it has quotes.
        
        // Basic parser logic
        const row = [];
        let cleanLine = line + ','; // append comma to ensure last field is caught
        let currentField = '';
        let inQuote = false;
        
        for (let char of cleanLine) {
            if (char === '"') {
                inQuote = !inQuote;
            } else if (char === ',' && !inQuote) {
                row.push(currentField.trim());
                currentField = '';
            } else {
                currentField += char;
            }
        }
        
        // Expected indices: 
        // 0: DATE, 1: INCOME, 2: EXPENSE, 3: DESCRIPTION, 4: ACCOUNT, 5: CATEGORY
        if (row.length < 6) continue;
        
        const expenseStr = row[2] ? row[2].replace(/[$,"]/g, '') : '0';
        const category = row[5] ? row[5].trim() : 'Uncategorized';
        
        const expense = parseFloat(expenseStr);
        
        // Sum expenses (expenses are negative in CSV, but positive in screenshot "Total Spent")
        // We will sum the absolute value of negative expenses.
        // Income is positive.
        
        // The screenshot shows "Total Spent", implying we only care about outflows (Expense column).
        // The Expense column has values like "-$50.00", "-$1,405.99".
        
        if (expense < 0) {
            if (!sums[category]) {
                sums[category] = 0;
                counts[category] = 0;
            }
            sums[category] += Math.abs(expense);
            counts[category]++;
        }
    }

    console.log("Verification Results:");
    let allMatch = true;
    for (const [cat, target] of Object.entries(targetCategories)) {
        const actualSum = sums[cat] || 0;
        const actualCount = counts[cat] || 0;
        
        const sumDiff = Math.abs(actualSum - target.expectedAmount);
        const countDiff = Math.abs(actualCount - target.expectedCount);
        
        const isSumMatch = sumDiff < 1.0; // Allow distinct floating point errors
        const isCountMatch = countDiff === 0;
        
        console.log(`Category: ${cat}`);
        console.log(`  Expected: $${target.expectedAmount.toFixed(2)} (${target.expectedCount})`);
        console.log(`  Actual:   $${actualSum.toFixed(2)} (${actualCount})`);
        console.log(`  Match:    ${isSumMatch && isCountMatch ? 'YES' : 'NO'}`);
        
        if (!isSumMatch || !isCountMatch) allMatch = false;
    }
    
} catch (err) {
    console.error("Error reading or parsing file:", err);
}
