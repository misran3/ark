'use client';

import React, { useEffect, useState } from 'react';
import type { VisaControlRule } from '@/src/types/api';

interface VisaShieldsContainerProps {
  dataUrl?: string;
}

export function VisaShieldsContainer({
  dataUrl = '/mocks/visa_controls.json',
}: VisaShieldsContainerProps) {
  const [controls, setControls] = useState<VisaControlRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(dataUrl)
      .then((res) => res.json())
      .then((data) => {
        setControls(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('VisaShieldsContainer error:', err);
        setLoading(false);
      });
  }, [dataUrl]);

  if (loading) return <div className="animate-pulse h-20 bg-white/5 rounded-lg" />;
  if (controls.length === 0) return null;

  return (
    <div className="w-full max-w-md mx-auto mt-8">
      <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-fuchsia-500/80 mb-3 text-center">
        Active Visa Shields
      </h3>
      <div className="grid grid-cols-1 gap-2">
        {controls.map((control) => (
          <div
            key={control.rule_id}
            className="flex items-center justify-between p-3 bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-lg backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse" />
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">
                  {control.control_type.replace(/_/g, ' ')}
                </div>
                <div className="text-[10px] text-fuchsia-400/70 font-mono">
                  ID: {control.rule_id}
                </div>
              </div>
            </div>
            {control.threshold && (
              <div className="text-sm font-mono text-white">
                ${control.threshold}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
