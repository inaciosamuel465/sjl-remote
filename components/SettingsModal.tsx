import React, { useState, useEffect } from 'react';
import { AppSettings, KeyCode } from '../types';
import { Button } from './Button';
import { X, Smartphone, Zap, Trash2, Keyboard, Server, Terminal } from 'lucide-react';

interface Props {
  settings: AppSettings;
  onUpdate: (newSettings: AppSettings) => void;
  onClose: () => void;
  onClearData: () => void;
}

const MAPPABLE_ACTIONS = [
  { label: 'Power', code: KeyCode.POWER },
  { label: 'Home', code: KeyCode.HOME },
  { label: 'Back', code: KeyCode.BACK },
  { label: 'Menu', code: KeyCode.MENU },
  { label: 'Up', code: KeyCode.UP },
  { label: 'Down', code: KeyCode.DOWN },
  { label: 'Left', code: KeyCode.LEFT },
  { label: 'Right', code: KeyCode.RIGHT },
  { label: 'Select (OK)', code: KeyCode.OK },
  { label: 'Volume Up', code: KeyCode.VOLUME_UP },
  { label: 'Volume Down', code: KeyCode.VOLUME_DOWN },
];

export const SettingsModal: React.FC<Props> = ({ settings, onUpdate, onClose, onClearData }) => {
  const [recordingAction, setRecordingAction] = useState<number | null>(null);
  const [localBackendUrl, setLocalBackendUrl] = useState(settings.backendUrl);

  const toggleSetting = (key: keyof AppSettings) => {
    // @ts-ignore - simple toggle for boolean keys
    onUpdate({ ...settings, [key]: !settings[key] });
  };

  const toggleDiscovery = (key: keyof AppSettings['preferredDiscovery']) => {
    onUpdate({
      ...settings,
      preferredDiscovery: {
        ...settings.preferredDiscovery,
        [key]: !settings.preferredDiscovery[key]
      }
    });
  };

  const saveBackendUrl = () => {
    onUpdate({ ...settings, backendUrl: localBackendUrl });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (recordingAction !== null) {
        e.preventDefault();
        e.stopPropagation();
        
        const newKey = e.code;
        const newMappings = { ...settings.keyMappings };

        // Clean up previous mappings for this action
        Object.keys(newMappings).forEach(key => {
          if (newMappings[key] === recordingAction) {
            delete newMappings[key];
          }
        });
        
        if (newMappings[newKey]) {
          delete newMappings[newKey];
        }

        newMappings[newKey] = recordingAction;
        onUpdate({ ...settings, keyMappings: newMappings });
        setRecordingAction(null);
      }
    };

    if (recordingAction !== null) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recordingAction, settings, onUpdate]);

  const getKeyForAction = (code: number) => {
    return Object.keys(settings.keyMappings).find(key => settings.keyMappings[key] === code) || 'None';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-2xl p-0 shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 shrink-0">
          <h2 className="text-lg font-bold text-white">Settings</h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          
          {/* General Section */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">General</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Zap size={18} /></div>
                <div>
                  <p className="text-sm font-medium text-white">Auto-connect</p>
                  <p className="text-xs text-zinc-500">Connect to last device on startup</p>
                </div>
              </div>
              <button 
                onClick={() => toggleSetting('autoConnect')}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.autoConnect ? 'bg-blue-600' : 'bg-zinc-700'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${settings.autoConnect ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><Smartphone size={18} /></div>
                <div>
                  <p className="text-sm font-medium text-white">Haptic Feedback</p>
                  <p className="text-xs text-zinc-500">Vibrate on button press</p>
                </div>
              </div>
              <button 
                onClick={() => toggleSetting('enableHaptics')}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.enableHaptics ? 'bg-purple-600' : 'bg-zinc-700'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${settings.enableHaptics ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </section>

          {/* Developer / Real Backend Section */}
          <section className="space-y-4 border-t border-zinc-800 pt-4">
             <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
               <Terminal size={14} /> Developer Mode
             </h3>

             <div className="flex items-center justify-between">
               <div className="flex items-center space-x-3">
                 <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-400"><Server size={18} /></div>
                 <div>
                   <p className="text-sm font-medium text-white">Demo Mode</p>
                   <p className="text-xs text-zinc-500">Use simulated devices</p>
                 </div>
               </div>
               <button 
                 onClick={() => toggleSetting('demoMode')}
                 className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.demoMode ? 'bg-yellow-600' : 'bg-zinc-700'}`}
               >
                 <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${settings.demoMode ? 'translate-x-6' : 'translate-x-0'}`} />
               </button>
             </div>

             {!settings.demoMode && (
               <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-2">
                  <label className="text-xs text-zinc-400">Bridge Server URL</label>
                  <div className="flex space-x-2">
                    <input 
                      type="text" 
                      value={localBackendUrl}
                      onChange={(e) => setLocalBackendUrl(e.target.value)}
                      placeholder="http://localhost:3001"
                      className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                    />
                    <Button onClick={saveBackendUrl} className="px-3 h-10 text-xs">Save</Button>
                  </div>
                  <p className="text-[10px] text-zinc-600">
                    Requires a local Node.js server running adbkit.
                  </p>
               </div>
             )}
          </section>

          {/* Key Mappings Section */}
          <section className="space-y-4 pt-4 border-t border-zinc-800">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <Keyboard size={14} /> Custom Key Mappings
            </h3>
            
            <div className="bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden">
              {MAPPABLE_ACTIONS.map((action) => (
                <div key={action.code} className="flex items-center justify-between p-3 border-b border-zinc-800 last:border-0 hover:bg-zinc-900/50 transition-colors">
                  <span className="text-sm text-zinc-300">{action.label}</span>
                  <button
                    onClick={() => setRecordingAction(action.code)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all min-w-[80px] text-center
                      ${recordingAction === action.code 
                        ? 'bg-blue-500 text-white border-blue-400 animate-pulse' 
                        : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200'
                      }
                    `}
                  >
                    {recordingAction === action.code ? 'Press Key...' : getKeyForAction(action.code)}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Data Management */}
          <section className="pt-2 border-t border-zinc-800">
             <Button variant="ghost" onClick={onClearData} className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 justify-start px-2">
               <Trash2 size={16} className="mr-2" />
               Clear Saved Data
             </Button>
          </section>
        </div>
      </div>
    </div>
  );
};
