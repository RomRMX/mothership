import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import TransactionList from './TransactionList';

const CategoryRow = ({ category, amount, count, transactions }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Format currency
    const formattedAmount = amount.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
    });

    return (
        <div className="category-row-container">
            <div className="category-row" onClick={() => setIsOpen(!isOpen)}>
                <div className="category-name">{category}</div>
                <div className="category-amount">{formattedAmount}</div>
                <div className="category-count">{count}</div>
                <div className={`expand-icon ${isOpen ? 'open' : ''}`}>
                    <ChevronDown size={20} />
                </div>
            </div>
            <TransactionList transactions={transactions} isOpen={isOpen} />
        </div>
    );
};

export default CategoryRow;
