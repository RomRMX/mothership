import React from 'react';
import { Button } from '../ui/Button';
import './Header.css';

export const Header: React.FC = () => {
    return (
        <div className="at-app-header">
            <div className="at-title-bar">
                <h1 className="at-app-title">AUTOTHRESH <span className="pro-badge">PRO</span></h1>
                <div className="at-launch-badge">🔥 LAUNCH PRICE</div>
            </div>

            <div className="at-preset-bar">
                <Button variant="ghost" size="sm" className="at-preset-reload">↻</Button>
                <div className="at-preset-dropdown">Select Preset</div>
                <div className="at-preset-actions">
                    <Button variant="ghost" size="sm">💾</Button>
                    <Button variant="ghost" size="sm">🗑️</Button>
                </div>
            </div>
        </div>
    );
};
