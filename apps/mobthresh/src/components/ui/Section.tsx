import React, { useState } from 'react';
import './Section.css';

interface SectionProps {
    title?: string;
    children: React.ReactNode;
    collapsible?: boolean;
    defaultOpen?: boolean;
    className?: string;
    actions?: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({
    title,
    children,
    collapsible = false,
    defaultOpen = true,
    className = '',
    actions,
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={`at-section ${className}`}>
            {title && (
                <div
                    className={`at-section-header ${collapsible ? 'at-section-header--collapsible' : ''}`}
                    onClick={() => collapsible && setIsOpen(!isOpen)}
                >
                    <span className="at-section-title">{title}</span>
                    <div className="at-section-actions">
                        {actions}
                        {collapsible && (
                            <span className={`at-chevron ${isOpen ? 'open' : ''}`}>▼</span>
                        )}
                    </div>
                </div>
            )}
            {(!collapsible || isOpen) && (
                <div className="at-section-content">
                    {children}
                </div>
            )}
        </div>
    );
};
