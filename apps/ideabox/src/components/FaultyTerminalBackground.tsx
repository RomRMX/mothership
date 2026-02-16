'use client';

import React, { useEffect, useRef } from 'react';

const FaultyTerminalBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resize);
        resize();

        const chars = '0123456789ABCDEFHIJKLMNOPQRSTUVWXYZ$%&*@#';
        const fontSize = 16 * 2.3;
        const columns = Math.ceil(canvas.width / fontSize);
        const rows = Math.ceil(canvas.height / fontSize);

        const grid: { char: string; opacity: number }[][] = [];
        for (let i = 0; i < columns; i++) {
            grid[i] = [];
            for (let j = 0; j < rows; j++) {
                grid[i][j] = {
                    char: chars[Math.floor(Math.random() * chars.length)],
                    opacity: Math.random() * 0.5
                };
            }
        }

        let time = 0;
        const render = () => {
            time += 0.01 * 0.3;
            ctx.fillStyle = '#050505';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.font = `bold ${fontSize}px monospace`;

            for (let i = 0; i < grid.length; i++) {
                for (let j = 0; j < (grid[i]?.length || 0); j++) {
                    const cell = grid[i][j];
                    if (Math.random() > 0.96) {
                        cell.char = chars[Math.floor(Math.random() * chars.length)];
                    }
                    const noise = Math.sin(time + i * 0.5 + j * 0.3) * 0.5 + 0.5;
                    const flicker = Math.random() > 0.95 ? 0.2 : 1;
                    const finalOpacity = cell.opacity * noise * flicker * 0.8;

                    ctx.fillStyle = `rgba(43, 42, 91, ${finalOpacity})`;
                    ctx.fillText(cell.char, i * fontSize, j * fontSize);
                }
            }
            animationFrameId = requestAnimationFrame(render);
        };

        render();
        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ filter: 'contrast(1.2) brightness(0.8)' }}
        />
    );
};

export default FaultyTerminalBackground;
