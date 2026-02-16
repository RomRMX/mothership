import React, { useState } from 'react';
import { Section } from '../ui/Section';
import { Slider } from '../ui/Slider';
import { Toggle } from '../ui/Toggle';
import { Button } from '../ui/Button';
import './ThresholdControls.css';

export interface ThresholdState {
    specular: number;
    highs: number;
    mids: number;
    shadows: number;
}

export interface ChannelVisibility {
    specular: boolean;
    highs: boolean;
    mids: boolean;
    shadows: boolean;
}

interface ThresholdControlsProps {
    thresholds: ThresholdState;
    visible: ChannelVisibility;
    onThresholdChange: (partial: Partial<ThresholdState>) => void;
    onVisibilityChange: (partial: Partial<ChannelVisibility>) => void;
}

interface ChannelRowProps {
    label: string;
    value: number;
    color: string;
    visible: boolean;
    onToggle: (v: boolean) => void;
    onChange: (v: number) => void;
}

const ChannelRow: React.FC<ChannelRowProps> = ({ label, value, color, visible, onToggle, onChange }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="at-channel-row-container">
            <div className="at-channel-main">
                <Button
                    variant="ghost"
                    size="sm"
                    className={`at-expand-btn ${expanded ? 'expanded' : ''}`}
                    onClick={() => setExpanded(!expanded)}
                >
                    ◄
                </Button>

                <div className="at-channel-label" style={{ color }}>{label} ({value})</div>

                <Toggle checked={visible} onChange={onToggle} />
            </div>

            <div className="at-channel-slider">
                <Slider value={value} onChange={onChange} max={255} showValueInput={false} />
            </div>

            {expanded && (
                <div className="at-channel-details">
                    <div className="detail-row">
                        <label>Size</label>
                        <Slider value={152} onChange={() => { }} max={200} showValueInput={true} />
                    </div>
                </div>
            )}
        </div>
    );
};

export const ThresholdControls: React.FC<ThresholdControlsProps> = ({
    thresholds, visible, onThresholdChange, onVisibilityChange
}) => {
    return (
        <Section title="THRESHOLD CONTROLS" className="at-threshold-controls">
            <div className="at-tabs">
                <Button className="tab active">Shift Colors</Button>
                <Button className="tab">Source Colors</Button>
            </div>

            <div className="at-channels-list">
                <ChannelRow
                    label="SPECULAR"
                    value={thresholds.specular}
                    color="#fff"
                    visible={visible.specular}
                    onToggle={(v) => onVisibilityChange({ specular: v })}
                    onChange={(v) => onThresholdChange({ specular: v })}
                />
                <ChannelRow
                    label="HIGHLIGHTS"
                    value={thresholds.highs}
                    color="#ffd700"
                    visible={visible.highs}
                    onToggle={(v) => onVisibilityChange({ highs: v })}
                    onChange={(v) => onThresholdChange({ highs: v })}
                />
                <ChannelRow
                    label="MIDTONES"
                    value={thresholds.mids}
                    color="#ff5500"
                    visible={visible.mids}
                    onToggle={(v) => onVisibilityChange({ mids: v })}
                    onChange={(v) => onThresholdChange({ mids: v })}
                />
                <ChannelRow
                    label="SHADOWS"
                    value={thresholds.shadows}
                    color="#0066ff"
                    visible={visible.shadows}
                    onToggle={(v) => onVisibilityChange({ shadows: v })}
                    onChange={(v) => onThresholdChange({ shadows: v })}
                />
            </div>

            <div className="at-footer-actions">
                <Button variant="secondary" size="sm">Knockout</Button>
                <Button variant="secondary" size="sm">Spot Colors</Button>
                <Button variant="secondary" size="sm">Clear Spot</Button>
            </div>
        </Section>
    );
};
