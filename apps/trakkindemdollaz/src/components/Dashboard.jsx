import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import CategoryRow from './CategoryRow';

const Dashboard = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({ income: 0, expenses: 0 });
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [filterType, setFilterType] = useState('expense'); // 'expense' | 'income'

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/2025 WELLS.csv');
                const reader = response.body.getReader();
                const result = await reader.read(); // raw array
                const decoder = new TextDecoder('utf-8');
                const csv = decoder.decode(result.value);

                // Find the line that starts with DATE (the header)
                const lines = csv.split('\n');
                const headerIndex = lines.findIndex(line => line.includes('DATE,INCOME,EXPENSE'));
                const cleanCsv = headerIndex !== -1 ? lines.slice(headerIndex).join('\n') : csv;

                Papa.parse(cleanCsv, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        processData(results.data);
                        setLoading(false);
                    },
                    error: (err) => {
                        setError(err.message);
                        setLoading(false);
                    }
                });
            } catch (err) {
                setError('Failed to fetch data');
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const cleanMerchantName = (description) => {
        if (!description) return 'Unknown';
        let clean = description;

        // Remove common prefixes
        clean = clean.replace(/PURCHASE AUTHORIZED ON \d{2}\/\d{2}/g, '');
        clean = clean.replace(/RECURRING PAYMENT AUTHORIZED ON \d{2}\/\d{2}/g, '');
        clean = clean.replace(/ZELLE TO /g, '');

        // Remove URLs
        clean = clean.replace(/HTTPS?:\/\/[^\s]+/gi, '');

        // Remove known garbage patterns at the end
        clean = clean.replace(/\s\w{2}\sS\d+.*/, ''); // Remove " NV S465..."
        clean = clean.replace(/\sDE\sP\d+.*/, '');
        clean = clean.replace(/\sCARD\s\d+/, '');

        return clean.trim().split('#')[0].trim();
    };

    const processData = (rawData) => {
        const categoryMap = {};
        let totalIncome = 0;
        let totalExpenses = 0;

        rawData.forEach(row => {
            const expenseStr = row.EXPENSE ? row.EXPENSE.replace(/[$,"]/g, '') : '0';
            const incomeStr = row.INCOME ? row.INCOME.replace(/[$,"]/g, '') : '0';

            const expense = parseFloat(expenseStr);
            const income = parseFloat(incomeStr);

            const isExpense = expense < 0;
            const isIncome = income > 0;

            const amount = isExpense ? Math.abs(expense) : income;

            if (isIncome) totalIncome += income;
            else if (isExpense) totalExpenses += Math.abs(expense);

            if (amount > 0) {
                let category = row.CATEGORY ? row.CATEGORY.trim() : 'Uncategorized';
                if (!category) category = 'Uncategorized';

                const type = isIncome ? 'income' : 'expense';

                if (!categoryMap[type]) categoryMap[type] = {};
                if (!categoryMap[type][category]) {
                    categoryMap[type][category] = {
                        name: category,
                        total: 0,
                        count: 0,
                        type: type,
                        merchants: {} // Map merchant name -> { total, count }
                    };
                }

                const catData = categoryMap[type][category];
                catData.total += amount;
                catData.count += 1;

                // Merchant Grouping
                const merchantName = cleanMerchantName(row.DESCRIPTION);
                if (!catData.merchants[merchantName]) {
                    catData.merchants[merchantName] = {
                        name: merchantName,
                        total: 0,
                        visits: 0
                    };
                }
                catData.merchants[merchantName].total += amount;
                catData.merchants[merchantName].visits += 1;
            }
        });

        setStats({ income: totalIncome, expenses: totalExpenses });
        setData(categoryMap);
    };

    if (loading) return <div className="loading-state">Loading data...</div>;
    if (error) return <div className="error-state">Error: {error}</div>;

    // Flatten currently selected filter data
    const currentCategories = data[filterType]
        ? Object.values(data[filterType]).sort((a, b) => b.total - a.total)
        : [];

    return (
        <div className="dashboard-container compact">
            <header className="dashboard-header-simple">
                <h1 className="brand-title">TRAKKINDEMDOLLAZ</h1>
            </header>

            {/* Header Stats Card */}
            <div className="stats-grid compact">
                <div
                    className={`stat-card income ${filterType === 'income' ? 'active' : ''}`}
                    onClick={() => { setFilterType('income'); setSelectedCategory(null); }}
                >
                    <div className="stat-label">Overall Income</div>
                    <div className="stat-value">
                        {stats.income.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </div>
                </div>
                <div
                    className={`stat-card expense ${filterType === 'expense' ? 'active' : ''}`}
                    onClick={() => { setFilterType('expense'); setSelectedCategory(null); }}
                >
                    <div className="stat-label">Total Expenses</div>
                    <div className="stat-value">
                        {stats.expenses.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </div>
                </div>
            </div>

            {/* Categories Grid */}
            <div className="category-grid compact">
                {currentCategories.map(cat => (
                    <div
                        key={cat.name}
                        className={`category-card ${selectedCategory?.name === cat.name ? 'selected' : ''}`}
                        onClick={() => setSelectedCategory(cat)}
                    >
                        <div className="card-header">
                            <span className="cat-name">{cat.name}</span>
                            <span className="cat-count">{cat.count} txns</span>
                        </div>
                        <div className="cat-amount">
                            {cat.total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Merchant Breakdown Section */}
            <div className="transactions-section">
                {selectedCategory ? (
                    <div className="transactions-container fade-in">
                        <h2 className="section-title">
                            {selectedCategory.name} Breakdown
                        </h2>
                        <div className="tx-list-viewer">
                            <div className="tx-header">
                                <span>Company Name</span>
                                <span>Visits</span>
                                <span style={{ textAlign: 'right' }}>Amount Spent</span>
                            </div>
                            {Object.values(selectedCategory.merchants)
                                .sort((a, b) => b.total - a.total)
                                .map((merchant, idx) => (
                                    <div key={idx} className="tx-row">
                                        <span className="tx-desc" title={merchant.name}>{merchant.name}</span>
                                        <span className="tx-date">{merchant.visits}</span>
                                        <span className="tx-amt">
                                            {merchant.total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    </div>
                ) : (
                    <div className="empty-selection">
                        Select {filterType} category to view breakdown
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
