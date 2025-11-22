import React, { useState, useRef, useEffect } from 'react';
import { DiscoveredDevice, KeyCode, AppSettings } from '../types';
import { tvService } from '../services/tvService';
import { Button } from './Button';
import { 
  Power, Home, ChevronLeft, ChevronUp, ChevronDown, ChevronRight, 
  Menu, Volume2, VolumeX, Play, Pause, MoreHorizontal, Keyboard,
  Grid, LayoutTemplate, Activity, MousePointer2
} from 'lucide-react';

interface Props {
  device: DiscoveredDevice;
  onDisconnect: () => void;
  settings: AppSettings;
}

export const RemoteView: React.FC<Props> = ({ device, onDisconnect, settings }) => {
  const [activeTab, setActiveTab] = useState<'remote' | 'touchpad' | 'apps'>('remote');
  const touchpadRef = useRef<HTMLDivElement>(null);

  const send = (code: KeyCode) => {
    tvService.sendCommand(code).catch(err => console.error(err));
  };

  // Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mappedCode = settings.keyMappings[e.code];
      if (mappedCode) {
        e.preventDefault();
        send(mappedCode);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings]);

  // --- Touchpad Logic ---
  const touchStart = useRef({ x: 0, y: 0, time: 0 });
  const lastMove = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    touchpadRef.current?.setPointerCapture(e.pointerId);
    touchStart.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    lastMove.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const deltaX = e.clientX - touchStart.current.x;
    const deltaY = e.clientY - touchStart.current.y;
    const deltaTime = Date.now() - touchStart.current.time;
    const distance = Math.sqrt(deltaX*deltaX + deltaY*deltaY);

    // If short tap without much movement, send CLICK (OK)
    if (distance < 10 && deltaTime < 200) {
      tvService.sendTouch(e.clientX, e.clientY, 'tap');
      send(KeyCode.OK);
    }
  };
  
  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.buttons === 1) {
      const dx = e.clientX - lastMove.current.x;
      const dy = e.clientY - lastMove.current.y;
      tvService.sendMouseDelta(dx, dy);
      lastMove.current = { x: e.clientX, y: e.clientY };
    }
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="px-6 pt-4 pb-2 flex items-center justify-between bg-zinc-900/50 border-b border-zinc-800">
        <div>
          <h2 className="font-bold text-white text-sm">{device.name}</h2>
          <div className="flex items-center text-xs text-green-500 space-x-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span>Connected</span>
          </div>
        </div>
        <button onClick={onDisconnect} className="p-2 text-zinc-500 hover:text-red-400 transition-colors">
          <Power className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        
        {activeTab === 'remote' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 overflow-y-auto custom-scrollbar">
            
            {/* D-Pad */}
            <div className="relative w-64 h-64 bg-zinc-900 rounded-full shadow-[0_0_50px_-12px_rgba(0,0,0,0.8)] border border-zinc-800 flex items-center justify-center">
              <button onClick={() => send(KeyCode.UP)} className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-20 flex items-start justify-center pt-4 text-zinc-500 active:text-blue-500 active:scale-95 transition-all">
                <ChevronUp size={32} />
              </button>
              <button onClick={() => send(KeyCode.DOWN)} className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-20 flex items-end justify-center pb-4 text-zinc-500 active:text-blue-500 active:scale-95 transition-all">
                <ChevronDown size={32} />
              </button>
              <button onClick={() => send(KeyCode.LEFT)} className="absolute left-2 top-1/2 -translate-y-1/2 w-20 h-20 flex items-center justify-start pl-4 text-zinc-500 active:text-blue-500 active:scale-95 transition-all">
                <ChevronLeft size={32} />
              </button>
              <button onClick={() => send(KeyCode.RIGHT)} className="absolute right-2 top-1/2 -translate-y-1/2 w-20 h-20 flex items-center justify-end pr-4 text-zinc-500 active:text-blue-500 active:scale-95 transition-all">
                <ChevronRight size={32} />
              </button>
              
              {/* Center OK */}
              <button 
                onClick={() => send(KeyCode.OK)}
                className="w-24 h-24 bg-zinc-800 rounded-full shadow-inner shadow-black/50 flex items-center justify-center border border-zinc-700 active:bg-blue-600 active:border-blue-500 active:text-white text-zinc-300 transition-all"
              >
                <span className="font-bold tracking-wider text-sm">OK</span>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-6 w-full max-w-xs">
              <Button variant="secondary" onClick={() => send(KeyCode.BACK)} className="h-14 flex-col gap-1 text-xs">
                <ChevronLeft size={20} /> Back
              </Button>
              <Button variant="secondary" onClick={() => send(KeyCode.HOME)} className="h-14 flex-col gap-1 text-xs">
                <Home size={20} /> Home
              </Button>
              <Button variant="secondary" onClick={() => send(KeyCode.MENU)} className="h-14 flex-col gap-1 text-xs">
                <Menu size={20} /> Menu
              </Button>
            </div>

            {/* Volume & Playback */}
            <div className="w-full max-w-xs bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                 <Button variant="ghost" onClick={() => send(KeyCode.VOLUME_DOWN)} className="h-12 w-12"><Volume2 className="w-5 h-5" /></Button>
                 <div className="h-1 bg-zinc-700 flex-1 mx-4 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-500 w-1/2"></div>
                 </div>
                 <Button variant="ghost" onClick={() => send(KeyCode.VOLUME_UP)} className="h-12 w-12"><Volume2 className="w-6 h-6" /></Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                 <Button variant="secondary" onClick={() => send(KeyCode.PLAY_PAUSE)} className="h-12"><Play size={18} className="fill-current" /></Button>
                 <Button variant="secondary" onClick={() => send(KeyCode.PLAY_PAUSE)} className="h-12"><Pause size={18} className="fill-current" /></Button>
                 <Button variant="secondary" onClick={() => send(KeyCode.MUTE)} className="h-12 text-red-400"><VolumeX size={20} /></Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'touchpad' && (
          <div className="flex-1 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-2">
               <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium uppercase tracking-wider">
                 <MousePointer2 size={14} /> Mouse Mode
               </div>
               <div className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-500">Active</div>
            </div>
            <div 
              ref={touchpadRef}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerMove={handlePointerMove}
              className="flex-1 bg-zinc-900 rounded-3xl border border-zinc-800 shadow-inner shadow-black/50 relative overflow-hidden touch-none cursor-crosshair"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0,rgba(0,0,0,0)_70%)]"></div>
              <div className="absolute bottom-4 left-0 right-0 text-center text-zinc-600 text-xs uppercase tracking-widest pointer-events-none">
                Touch Area
              </div>
            </div>
            <p className="text-center text-zinc-500 text-xs mt-4">Slide to move mouse • Tap to click</p>
          </div>
        )}

        {activeTab === 'apps' && (
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
             <h3 className="text-zinc-400 mb-4 text-sm font-medium uppercase tracking-wider">Installed Apps</h3>
             <div className="grid grid-cols-3 gap-4">
               {tvService.getMockApps().map(app => (
                 <button key={app.id} className="flex flex-col items-center gap-2 group" onClick={() => tvService.sendText(app.packageName)}>
                    <div className="w-16 h-16 bg-zinc-800 rounded-2xl p-3 border border-zinc-700 shadow-lg group-active:scale-95 transition-all flex items-center justify-center">
                      <img src={app.icon} alt={app.name} className="w-full h-full object-contain drop-shadow-md" />
                    </div>
                    <span className="text-xs text-zinc-400 group-hover:text-white">{app.name}</span>
                 </button>
               ))}
             </div>
          </div>
        )}

      </div>

      {/* Bottom Navigation */}
      <div className="h-16 bg-zinc-900 border-t border-zinc-800 flex items-center justify-around px-2">
        <button onClick={() => setActiveTab('remote')} className={`flex flex-col items-center justify-center w-16 h-full gap-1 ${activeTab === 'remote' ? 'text-blue-400' : 'text-zinc-500'}`}>
          <LayoutTemplate size={20} />
          <span className="text-[10px]">Remote</span>
        </button>
        <button onClick={() => setActiveTab('touchpad')} className={`flex flex-col items-center justify-center w-16 h-full gap-1 ${activeTab === 'touchpad' ? 'text-blue-400' : 'text-zinc-500'}`}>
          <Grid size={20} />
          <span className="text-[10px]">Touch</span>
        </button>
        <button onClick={() => setActiveTab('apps')} className={`flex flex-col items-center justify-center w-16 h-full gap-1 ${activeTab === 'apps' ? 'text-blue-400' : 'text-zinc-500'}`}>
          <Activity size={20} />
          <span className="text-[10px]">Apps</span>
        </button>
      </div>
    </div>
  );
};