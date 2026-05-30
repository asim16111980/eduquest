import { ReactNode } from 'react';

interface BarChartProps {
  data: Array<Record<string, unknown>>;
  xKey: string;
  yKey: string;
}

export function BarChart({ data, xKey, yKey }: BarChartProps) {
  // Simple implementation - in a real app, use a charting library like Chart.js or Recharts
  return (
    <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
      <p className="text-gray-500">Bar Chart Placeholder</p>
    </div>
  );
}