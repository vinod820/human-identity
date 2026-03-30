"use client";

import { useEffect, useRef, useState } from "react";

const images = [
  "https://images.unsplash.com/photo-1614689540268-6bc59e5e5a42?auto=format&fit=crop&w=2070&q=80",
  "https://images.unsplash.com/photo-1581368135155-81c286e27f08?auto=format&fit=crop&w=2070&q=80",
  "https://images.unsplash.com/photo-1551135040-6a4b8d6db6e7?auto=format&fit=crop&w=2070&q=80",
  "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=2070&q=80",
  "https://images.unsplash.com/photo-1550565118-3a14e8d0386f?auto=format&fit=crop&w=2070&q=80"
];

type Shape = {
  color: string;
  drift: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  sides: number;
  x: number;
  y: number;
  z: number;
};

function drawPolygon(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  sides: number,
  rotation: number
) {
  context.beginPath();

  for (let index = 0; index <= sides; index += 1) {
    const angle = rotation + (index / sides) * Math.PI * 2;
    const pointX = x + Math.cos(angle) * radius;
    const pointY = y + Math.sin(angle) * radius;

    if (index === 0) {
      context.moveTo(pointX, pointY);
    } else {
      context.lineTo(pointX, pointY);
    }
  }

  context.stroke();
}

export function BackgroundScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentImage((value) => (value + 1) % images.length);
    }, 3000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const colors = ["#00ff88", "#00ccff", "#ff4444", "#ffaa00"];
    const shapes: Shape[] = Array.from({ length: 20 }, (_, index) => ({
      color: colors[index % colors.length],
      drift: 0.6 + Math.random() * 1.4,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: 0.002 + Math.random() * 0.01,
      size: 18 + Math.random() * 30,
      sides: [3, 4, 6, 8][Math.floor(Math.random() * 4)],
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      z: 0.35 + Math.random() * 0.9
    }));

    let animationFrame = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const render = () => {
      const time = performance.now() * 0.001;
      context.clearRect(0, 0, canvas.width, canvas.height);

      shapes.forEach((shape, index) => {
        const scale = shape.z;
        const x = canvas.width * (0.5 + shape.x * 0.45) + Math.sin(time * shape.drift + index) * 30;
        const y = canvas.height * (0.5 + shape.y * 0.38) + Math.cos(time * (shape.drift + 0.25) + index) * 24;
        const radius = shape.size * scale;

        context.strokeStyle = `${shape.color}${Math.round(55 + scale * 60).toString(16).padStart(2, "0")}`;
        context.lineWidth = 1.2;
        drawPolygon(context, x, y, radius, shape.sides, shape.rotation);

        shape.rotation += shape.rotationSpeed;
      });

      animationFrame = window.requestAnimationFrame(render);
    };

    resize();
    render();
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} id="bg-canvas" className="bg-canvas" />

      <div className="assembly-bg-container" aria-hidden="true">
        {images.map((image, index) => (
          <div
            key={image}
            className={`assembly-bg-image ${index === currentImage ? "active" : ""}`}
            style={{ backgroundImage: `url(${image})` }}
          />
        ))}
        <div className="assembly-overlay" />
      </div>
    </>
  );
}
