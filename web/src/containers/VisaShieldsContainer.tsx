'use client';

import React, { useState } from 'react';
import { useVisaControls } from '@/src/hooks/security/useSecurity';
import type { VisaControlRule } from '@/src/types/api';

export function VisaShieldsContainer() {
  const { controls, loading, error, createControl, deleteControl } = useVisaControls();
  const [isCreating, setIsCreating] = useState(false);
  const [lastResponse, setLastResponse] = useState<any>(null);

  const handleCreateTestControl = async () => {
    setIsCreating(true);
    setLastResponse(null);
    
    const testRule: VisaControlRule = {
      rule_id: `test_${Date.now()}`,
      card_id: "4111111111111111",
      control_type: "spending_limit",
      threshold: 50.00,
      is_active: true,
      created_by: "user"
    };

    console.log('[VISA TEST] Creating control...', testRule);
    
    try {
      const result = await createControl(testRule);
      console.log('[VISA TEST] Create Result:', result);
      setLastResponse({ type: 'CREATE', result });
    } catch (err: any) {
      console.error('[VISA TEST] Create Error:', err);
      setLastResponse({ type: 'CREATE_ERROR', error: err.message, details: err.response?.data });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteControl = async (documentId: string) => {
    console.log(`[VISA TEST] Deleting control: ${documentId}`);
    setLastResponse(null);
    
    try {
      const result = await deleteControl(documentId);
      console.log('[VISA TEST] Delete Result:', result);
      setLastResponse({ type: 'DELETE', result });
    } catch (err: any) {
      console.error('[VISA TEST] Delete Error:', err);
      setLastResponse({ type: 'DELETE_ERROR', error: err.message, details: err.response?.data });
    }
  };

  if (loading && controls.length === 0) {
    return <div className="animate-pulse h-20 bg-white/5 rounded-lg" />;
  }

  return (
    <div className="w-full max-w-md mx-auto mt-8 space-y-6">
      <div className="text-center">
        <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-fuchsia-500/80 mb-3">
          Security Systems // VISA Shields
        </h3>
        
        {/* Action Buttons */}
        <button
          onClick={handleCreateTestControl}
          disabled={isCreating}
          className={`
            px-4 py-2 rounded border text-xs font-bold tracking-widest uppercase transition-all
            ${isCreating 
              ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed' 
              : 'bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-400 hover:bg-fuchsia-500/30 active:scale-95'}
          `}
        >
          {isCreating ? 'Initializing...' : 'Deploy Test Shield ($50 Limit)'}
        </button>
      </div>

      {/* Hook State Display */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-[10px] font-mono text-red-400">
          HOOK ERROR: {error.message}
        </div>
      )}

      {/* Controls List */}
      <div className="grid grid-cols-1 gap-2">
        {controls.length === 0 ? (
          <div className="text-center p-4 border border-dashed border-white/10 rounded text-gray-600 text-[10px] font-mono uppercase">
            No active shields detected
          </div>
        ) : (
          controls.map((control) => (
            <div
              key={control.rule_id}
              className="flex items-center justify-between p-3 bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-lg backdrop-blur-md group"
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
              
              <div className="flex items-center gap-4">
                {control.threshold && (
                  <div className="text-sm font-mono text-white">
                    ${control.threshold}
                  </div>
                )}
                <button
                  onClick={() => handleDeleteControl(control.rule_id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all text-red-400 text-[10px] font-bold uppercase border border-red-500/30"
                >
                  Deactivate
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
