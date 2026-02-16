import React from 'react';
import './Slider.css';

interface SliderProps {
    label?: string;
    value: number;
    min?: number;
    max?: number;
    step?: number;
    onChange: (value: number) => void;
    showValueInput?: boolean;
}

export const Slider: React.FC<SliderProps> = ({
    label,
    value,
    min = 0,
    max = 100,
    step = 1,
    onChange,
    showValueInput = true,
}) => {
    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className="at-slider-container">
            {label && (
                <div className="at-slider-header">
                    <span className="at-slider-label">{label}</span>
                    {showValueInput && <span className="at-slider-val-display">({value})</span>}
                </div>
            )}
            <div className="at-slider-input-wrapper">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="at-slider"
                    style={{ backgroundSize: `${percentage}% 100%` }}
                />
            </div>
        </div>
    );
};
