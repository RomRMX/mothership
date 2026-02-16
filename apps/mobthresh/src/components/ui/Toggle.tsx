import React from 'react';
import './Toggle.css';

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label }) => {
    return (
        <div className="at-toggle-container" onClick={() => onChange(!checked)}>
            <div className={`at-toggle ${checked ? 'at-toggle--checked' : ''}`}>
                <div className="at-toggle-thumb" />
            </div>
            {label && <span className="at-toggle-label">{label}</span>}
        </div>
    );
};
