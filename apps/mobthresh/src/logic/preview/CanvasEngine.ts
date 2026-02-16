export interface ProcessOptions {
    blur: number; // 0-10
    shadowLift: number; // 0-255
    exposure: number; // 0-1000 (roughly milliexposure)
    highlights: number; // 0-255
    thresholds: {
        specular: number;
        highs: number;
        mids: number;
        shadows: number;
    };
    visibleChannels: {
        specular: boolean;
        highs: boolean;
        mids: boolean;
        shadows: boolean;
    };
}

export class CanvasEngine {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private originalImageData: ImageData | null = null;
    private width: number = 0;
    private height: number = 0;

    constructor(width: number = 300, height: number = 300) {
        this.canvas = document.createElement('canvas');
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
        const context = this.canvas.getContext('2d', { willReadFrequently: true });
        if (!context) throw new Error("Could not get canvas context");
        this.ctx = context;
    }

    public getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }

    public loadImage(src: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                // Resize logic to fit within preview dimensions while maintaining aspect ratio
                const scale = Math.min(this.width / img.width, this.height / img.height);
                const w = img.width * scale;
                const h = img.height * scale;

                // Clear and center
                this.ctx.clearRect(0, 0, this.width, this.height);
                this.ctx.drawImage(img, (this.width - w) / 2, (this.height - h) / 2, w, h);

                this.originalImageData = this.ctx.getImageData(0, 0, this.width, this.height);
                resolve();
            };
            img.onerror = reject;
            img.src = src;
        });
    }

    public applyEffects(options: ProcessOptions) {
        if (!this.originalImageData) return;

        // 1. Get raw pixel data
        const currentData = new ImageData(
            new Uint8ClampedArray(this.originalImageData.data),
            this.originalImageData.width,
            this.originalImageData.height
        );
        const data = currentData.data;

        // 2. Apply pixel-level operations
        for (let i = 0; i < data.length; i += 4) {
            // -- Grayscale (Luminosity method) --
            let val = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];

            // -- Adjustments --
            // Exposure (Simple gain)
            val = val * (1 + options.exposure / 500);

            // Contrast / Shadow Lift / Highlights logic (Simplified for preview)
            // Shadow Lift: Brightens dark areas
            if (val < 128) {
                val = val + (options.shadowLift * (1 - val / 128));
            }

            // Highlights: Dims or Boosts bright areas
            if (val > 128) {
                // Simple highlight recovery
                val = val - ((255 - options.highlights) * ((val - 128) / 128) * 0.5);
            }

            // Clamp
            val = Math.max(0, Math.min(255, val));

            // -- Thresholding / Posterization visualization --
            // We want to visualize which pixel falls into which band
            let outR = 0, outG = 0, outB = 0;
            let matched = false;

            // Specular (White)
            if (options.visibleChannels.specular && val >= options.thresholds.specular) {
                outR = 255; outG = 255; outB = 255;
                matched = true;
            }
            // Highlights (Yellow)
            else if (options.visibleChannels.highs && val >= options.thresholds.highs) {
                outR = 255; outG = 215; outB = 0; // Gold
                matched = true;
            }
            // Midtones (Orange)
            else if (options.visibleChannels.mids && val >= options.thresholds.mids) {
                outR = 255; outG = 85; outB = 0; // #ff5500
                matched = true;
            }
            // Shadows (Blue)
            else if (options.visibleChannels.shadows && val >= options.thresholds.shadows) {
                outR = 0; outG = 102; outB = 255; // #0066ff
                matched = true;
            }

            // Apply Back
            if (matched) {
                data[i] = outR;
                data[i + 1] = outG;
                data[i + 2] = outB;
                // Alpha remains 255 unless we want transparency
            } else {
                // Background usually black for this plugin style
                data[i] = 0;
                data[i + 1] = 0;
                data[i + 2] = 0;
            }
        }

        // 3. Simple Box Blur (Approximation for performance)
        // If blur > 0, we should run a blur pass. 
        // For preview performance, we might skip heavy Gaussian or use CSS filter on the canvas element itself
        // But for pixel manipulation consistency, let's leave it raw or implement a fast box blur later.

        this.ctx.putImageData(currentData, 0, 0);

        // Apply CSS Blur via context filter if supported, or leave for CSS on container
        // this.ctx.filter = `blur(${options.blur}px)`;
        // this.ctx.drawImage(this.canvas, 0, 0); // Re-draw over itself? No, filter applies to drawing commands.
    }
}
