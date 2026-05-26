import { ReactNode } from 'react';

interface LineChartProps {
  data: any[];
  xKey: string;
  yKey: string;
  title: string;
}

export function LineChart({ data, xKey, yKey, title }: LineChartProps) {
  // Simple implementation - in a real app, use a charting library like Chart.js or Recharts
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
        <p className="text-gray-500">Line Chart Placeholder</p>
      </div>
    </div>
  );
}