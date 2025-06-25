import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toFixed(1).padStart(4, '0')}`;
}

export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export function validateClickTolerance(
  clickX: number,
  clickY: number,
  expectedX: number,
  expectedY: number,
  tolerance: number = 25
): boolean {
  return Math.abs(clickX - expectedX) <= tolerance && 
         Math.abs(clickY - expectedY) <= tolerance;
}
