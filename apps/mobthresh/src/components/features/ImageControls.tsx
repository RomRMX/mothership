import React from 'react';
import { Slider } from '../ui/Slider';
import { Button } from '../ui/Button';
import { Section } from '../ui/Section';
import './ImageControls.css';

export interface ImageControlsState {
    blur: number;
    shadowLift: number;
    exposure: number;
    highlights: number;
}

interface ImageControlsProps extends ImageControlsState {
    onChange: (partial: Partial<ImageControlsState>) => void;
}

export const ImageControls: React.FC<ImageControlsProps> = ({
    blur, shadowLift, exposure, highlights, onChange
}) => {
    return (
        <Section className="at-image-controls">
            <div className="at-pattern-toggle-bar">
                <Button variant="secondary" size="sm" className="pattern-btn">Edit Patterns</Button>
                <div className="at-theme-toggles">
                    <Button variant="ghost" size="sm" className="active">Light</Button>
                    <Button variant="ghost" size="sm">Dark</Button>
                </div>
            </div>

            <div className="at-control-group">
                <Slider
                    label="Blur"
                    value={blur}
                    max={10}
                    step={0.1}
                    onChange={(v) => onChange({ blur: v })}
                />
                <Slider
                    label="Shadow Lift"
                    value={shadowLift}
                    max={255}
                    step={1}
                    onChange={(v) => onChange({ shadowLift: v })}
                />
                <Slider
                    label="Exposure"
                    value={exposure}
                    max={1000}
                    step={10}
                    onChange={(v) => onChange({ exposure: v })}
                />
                <Slider
                    label="Highlights"
                    value={highlights}
                    max={255}
                    step={1}
                    onChange={(v) => onChange({ highlights: v })}
                />
            </div>
        </Section>
    );
};
