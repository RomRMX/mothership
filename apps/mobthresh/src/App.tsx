import { useEffect, useRef, useState } from 'react'
import { Header } from './components/features/Header'
import { ImageControls, ImageControlsState } from './components/features/ImageControls'
import { ThresholdControls, ThresholdState, ChannelVisibility } from './components/features/ThresholdControls'
import { Button } from './components/ui/Button'
import { CanvasEngine } from './logic/preview/CanvasEngine'
import './App.css'

function App() {
    const canvasRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<CanvasEngine | null>(null);

    // State
    const [imgState, setImgState] = useState<ImageControlsState>({
        blur: 2.5,
        shadowLift: 64,
        exposure: 500,
        highlights: 64
    });

    const [thresholds, setThresholds] = useState<ThresholdState>({
        specular: 240,
        highs: 180,
        mids: 100,
        shadows: 40
    });

    const [visible, setVisible] = useState<ChannelVisibility>({
        specular: true,
        highs: true,
        mids: true,
        shadows: true
    });

    // Initialize Engine
    useEffect(() => {
        if (!engineRef.current && canvasRef.current) {
            engineRef.current = new CanvasEngine(360, 360);
            canvasRef.current.appendChild(engineRef.current.getCanvas());

            // Load default or placeholder
            // simple 1x1 pixel base64 for now if asset missing, or try public URL
            const pixel = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
            engineRef.current.loadImage(pixel);
        }
    }, []);

    // Update Effect
    useEffect(() => {
        if (engineRef.current) {
            engineRef.current.applyEffects({
                ...imgState,
                thresholds,
                visibleChannels: visible
            });
        }
    }, [imgState, thresholds, visible]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result && engineRef.current) {
                    engineRef.current.loadImage(event.target.result as string).then(() => {
                        // Initial apply
                        engineRef.current?.applyEffects({
                            ...imgState,
                            thresholds,
                            visibleChannels: visible
                        });
                    });
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    }

    return (
        <div className="app-container">
            <div className="at-back-link">
                <Button variant="ghost" size="sm">‹ Back to Plugins</Button>
            </div>

            <div className="at-plugin-panel">
                <Header />

                {/* Preview Area */}
                <div className="at-preview-area">
                    <div className="at-canvas-wrapper" ref={canvasRef}></div>
                    <input type="file" onChange={handleImageUpload} style={{ marginTop: 8, fontSize: 11, color: '#666' }} />
                </div>

                <div className="at-scroller">
                    <ImageControls
                        {...imgState}
                        onChange={(p) => setImgState(prev => ({ ...prev, ...p }))}
                    />
                    <ThresholdControls
                        thresholds={thresholds}
                        visible={visible}
                        onThresholdChange={(p) => setThresholds(prev => ({ ...prev, ...p }))}
                        onVisibilityChange={(p) => setVisible(prev => ({ ...prev, ...p }))}
                    />
                </div>
            </div>
        </div>
    )
}

export default App
