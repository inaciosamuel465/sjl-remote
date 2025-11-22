import React, { useState } from 'react';
import { DiscoveredDevice } from '../types';
import { Button } from './Button';

interface Props {
  device: DiscoveredDevice;
  onConfirm: (pin: string) => void;
  onCancel: () => void;
  isConnecting: boolean;
  error?: string;
}

export const PairingModal: React.FC<Props> = ({ device, onConfirm, onCancel, isConnecting, error }) => {
  const [pin, setPin] = useState('');

  const handleDigit = (digit: string) => {
    if (pin.length < 6) setPin(prev => prev + digit);
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-xs rounded-2xl p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-center mb-2 text-white">Enter PIN</h2>
        <p className="text-zinc-400 text-center text-sm mb-6">
          Please enter the code displayed on<br/> <span className="text-blue-400">{device.name}</span>
        </p>

        <div className="flex justify-center space-x-2 mb-8">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`w-10 h-12 rounded-lg border flex items-center justify-center text-xl font-mono
              ${pin[i] ? 'border-blue-500 text-white bg-blue-500/10' : 'border-zinc-700 text-zinc-600 bg-zinc-950'}
            `}>
              {pin[i] || '•'}
            </div>
          ))}
        </div>
        
        {error && <p className="text-red-500 text-xs text-center mb-4">{error}</p>}

        <div className="grid grid-cols-3 gap-3 mb-6">
           {[1,2,3,4,5,6,7,8,9].map(n => (
             <button key={n} onClick={() => handleDigit(n.toString())} className="h-12 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white font-medium active:scale-95 transition-transform">
               {n}
             </button>
           ))}
           <div />
           <button onClick={() => handleDigit('0')} className="h-12 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white font-medium active:scale-95 transition-transform">
             0
           </button>
           <button onClick={handleBackspace} className="h-12 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-lg text-zinc-400 flex items-center justify-center active:scale-95 transition-transform">
             ⌫
           </button>
        </div>

        <div className="flex space-x-3">
          <Button variant="ghost" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button 
            variant="primary" 
            className="flex-1" 
            onClick={() => onConfirm(pin)}
            disabled={pin.length < 4 || isConnecting}
          >
            {isConnecting ? 'Pairing...' : 'Connect'}
          </Button>
        </div>
      </div>
    </div>
  );
};