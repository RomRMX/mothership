import React from 'react';

const TransactionList = ({ transactions, isOpen }) => {
    // We handle the expansion animation via CSS max-height, so we always render the structure
    // but toggle a class.

    return (
        <div className={`transaction-list ${isOpen ? 'open' : ''}`}>
            <div className="transaction-list-inner">
                {transactions.map((tx, index) => (
                    <div key={index} className="transaction-item">
                        <span className="transaction-date">{tx.date}</span>
                        <span className="transaction-desc" title={tx.description}>{tx.description}</span>
                        <span className="transaction-amt">
                            {tx.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </span>
                    </div>
                ))}
                {transactions.length === 0 && (
                    <div className="transaction-item">No transactions found.</div>
                )}
            </div>
        </div>
    );
};

export default TransactionList;
