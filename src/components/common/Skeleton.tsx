import React from 'react';

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
        <div className="w-16 h-4 bg-slate-200 rounded"></div>
      </div>
      <div className="w-24 h-8 bg-slate-200 rounded mb-2"></div>
      <div className="w-36 h-4 bg-slate-100 rounded"></div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 6 }) => {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs animate-pulse">
      <div className="h-10 bg-slate-100 rounded-lg mb-4 flex items-center px-4 gap-4">
        <div className="w-12 h-4 bg-slate-200 rounded"></div>
        <div className="w-32 h-4 bg-slate-200 rounded"></div>
        <div className="w-48 h-4 bg-slate-200 rounded"></div>
        <div className="w-24 h-4 bg-slate-200 rounded ml-auto"></div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-12 bg-slate-50 border border-slate-100 rounded-lg flex items-center px-4 gap-4">
            <div className="w-8 h-4 bg-slate-200 rounded"></div>
            <div className="w-28 h-4 bg-slate-200 rounded"></div>
            <div className="w-44 h-4 bg-slate-200 rounded"></div>
            <div className="w-20 h-6 bg-slate-200 rounded-full ml-auto"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ChartSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs animate-pulse h-80 flex flex-col justify-between">
      <div className="w-48 h-5 bg-slate-200 rounded"></div>
      <div className="flex items-end justify-between h-48 px-4 gap-3">
        <div className="w-full bg-slate-100 rounded-t h-24"></div>
        <div className="w-full bg-slate-200 rounded-t h-36"></div>
        <div className="w-full bg-slate-100 rounded-t h-16"></div>
        <div className="w-full bg-slate-200 rounded-t h-40"></div>
        <div className="w-full bg-slate-100 rounded-t h-28"></div>
      </div>
    </div>
  );
};
