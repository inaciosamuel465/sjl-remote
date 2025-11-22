import React, { useState, useEffect } from 'react';
import { DiscoveredDevice, AppSettings, KeyCode, ConnectionStatus } from './types';
import { tvService } from './services/tvService';
import { DiscoveryView } from './components/DiscoveryView';
import { RemoteView } from './components/RemoteView';
import { PairingModal } from './components/PairingModal';
import { SettingsModal } from './components/SettingsModal';
import { Loader2, Smartphone } from 'lucide-react';

const DEFAULT_KEY_MAPPINGS: Record<string, number> = {
  'ArrowUp': KeyCode.UP,
  'ArrowDown': KeyCode.DOWN,
  'ArrowLeft': KeyCode.LEFT,
  'ArrowRight': KeyCode.RIGHT,
  'Enter': KeyCode.OK,
  'Backspace': KeyCode.BACK,
  'Escape': KeyCode.HOME,
  'Equal': KeyCode.VOLUME_UP,
  'Minus': KeyCode.VOLUME_DOWN,
  'KeyP': KeyCode.POWER,
  'KeyM': KeyCode.MENU
};

const DEFAULT_SETTINGS: AppSettings = {
  autoConnect: false,
  enableHaptics: true,
  lastConnectedDeviceId: null,
  preferredDiscovery: {
    mdns: true,
    ssdp: true,
    ipScan: true
  },
  keyMappings: DEFAULT_KEY_MAPPINGS,
  demoMode: false, // Default to REAL MODE now
  backendUrl: 'http://localhost:3001'
};

export default function App() {
  const [currentDevice, setCurrentDevice] = useState<DiscoveredDevice | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Modal States
  const [showPairing, setShowPairing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Connection/Pairing State
  const [pairingDevice, setPairingDevice] = useState<DiscoveredDevice | null>(null);
  const [pairingError, setPairingError] = useState<string | undefined>();
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAutoConnecting, setIsAutoConnecting] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Load settings on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('sjl-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        const merged = { 
          ...DEFAULT_SETTINGS, 
          ...parsed,
          preferredDiscovery: { ...DEFAULT_SETTINGS.preferredDiscovery, ...parsed.preferredDiscovery },
          keyMappings: { ...DEFAULT_SETTINGS.keyMappings, ...parsed.keyMappings }
        };
        setSettings(merged);
        // Configure Service with saved settings
        tvService.configure(merged.demoMode, merged.backendUrl);
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    } else {
      // Initial config
      tvService.configure(DEFAULT_SETTINGS.demoMode, DEFAULT_SETTINGS.backendUrl);
    }
  }, []);

  // Save settings on change
  useEffect(() => {
    localStorage.setItem('sjl-settings', JSON.stringify(settings));
    tvService.configure(settings.demoMode, settings.backendUrl);
  }, [settings]);

  // Auto-connect logic
  useEffect(() => {
    const checkAutoConnect = async () => {
      if (settings.autoConnect && settings.lastConnectedDeviceId && !isConnected && !isAutoConnecting) {
        
        // Check permission silently first
        await tvService.requestPermissions();

        setIsAutoConnecting(true);
        try {
          const device = await tvService.getDeviceById(settings.lastConnectedDeviceId);
          if (device) {
            if (device.requiresPin) {
               setPairingDevice(device);
               setShowPairing(true);
            } else {
               await attemptConnection(device);
            }
          }
        } catch (error) {
          console.log("Auto-connect failed", error);
        } finally {
          setIsAutoConnecting(false);
        }
      }
    };

    // Small delay to ensure service is configured
    const timeout = setTimeout(checkAutoConnect, 1000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.autoConnect, settings.lastConnectedDeviceId]);

  const handleDeviceSelect = async (device: DiscoveredDevice) => {
    if (device.requiresPin) {
      setPairingDevice(device);
      setShowPairing(true);
    } else {
      attemptConnection(device);
    }
  };

  const attemptConnection = async (device: DiscoveredDevice, pin?: string) => {
    setIsConnecting(true);
    setConnectionStatus('CONNECTING');
    setPairingError(undefined);
    
    try {
      await tvService.connectToDevice(device, pin, (status) => {
        setConnectionStatus(status);
      });
      
      // Connection successful
      setCurrentDevice(device);
      setIsConnected(true);
      setShowPairing(false);
      setPairingDevice(null);
      
      // Update Last Connected
      setSettings(prev => ({
        ...prev,
        lastConnectedDeviceId: device.id
      }));

    } catch (err: any) {
      let msg = err.message || 'Connection failed';
      if (err.message === 'INVALID_PIN') msg = 'Invalid PIN. Try again.';
      if (err.message === 'AUTH_TIMEOUT') msg = 'Authorization timed out on TV.';
      if (err.message === 'AUTH_DENIED') msg = 'Connection denied by TV.';
      if (err.message === 'NETWORK_ERROR') msg = 'Network error. Check bridge server.';
      if (err.message === 'UNAUTHORIZED') msg = 'Please check your TV screen to allow access.';
      
      setPairingError(msg);
      setConnectionStatus('ERROR');
    } finally {
      if (!isConnected) {
        setIsConnecting(false); 
      }
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setCurrentDevice(null);
    setIsAutoConnecting(false);
    setIsConnecting(false);
  };

  const handleClearData = () => {
    const newSettings = { ...DEFAULT_SETTINGS };
    setSettings(newSettings);
    localStorage.removeItem('sjl-settings');
    setShowSettings(false);
  };

  return (
    <div className="w-full h-screen bg-zinc-950 text-white flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-md h-full bg-black relative shadow-2xl flex flex-col overflow-hidden md:h-[800px] md:rounded-[3rem] md:border-8 md:border-zinc-800">
        
        {/* Status Bar Simulation */}
        <div className="h-8 bg-black flex items-center justify-between px-6 text-xs text-white font-medium z-10 select-none shrink-0">
          <span>9:41</span>
          <div className="flex space-x-1">
             <div className="w-4 h-4 rounded-full bg-zinc-800 border border-zinc-600" />
             <div className="w-4 h-4 rounded-full bg-zinc-800 border border-zinc-600" />
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden flex flex-col">
          {/* Full Screen Loader for Auto-Connect or Auth Waiting */}
          {isAutoConnecting || (isConnecting && !showPairing) ? (
             <div className="flex-1 flex flex-col items-center justify-center space-y-6 bg-zinc-950 p-8 text-center animate-in fade-in">
                {connectionStatus === 'WAITING_FOR_AUTH' ? (
                  <>
                     <div className="relative">
                       <div className="w-24 h-24 bg-blue-600/20 rounded-full animate-ping absolute inset-0"></div>
                       <div className="relative w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center border-2 border-blue-500">
                          <Smartphone className="w-10 h-10 text-blue-500" />
                       </div>
                     </div>
                     <div>
                       <h2 className="text-xl font-bold text-white mb-2">Check your TV</h2>
                       <p className="text-zinc-400">Please accept the connection request on your TV screen.</p>
                       <p className="text-xs text-zinc-500 mt-2">(ADB RSA Key Fingerprint)</p>
                     </div>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                    <p className="text-zinc-400 text-sm">
                      {isAutoConnecting ? "Restoring connection..." : "Connecting to TV..."}
                    </p>
                    {connectionStatus === 'CONNECTING' && !settings.demoMode && (
                      <p className="text-[10px] text-zinc-600 mt-2">Using Bridge: {settings.backendUrl}</p>
                    )}
                  </>
                )}
                
                {pairingError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs mt-4">
                    {pairingError}
                  </div>
                )}
                
                <button onClick={handleDisconnect} className="text-xs text-zinc-600 mt-8 hover:text-white transition-colors">
                  Cancel
                </button>
             </div>
          ) : !isConnected ? (
            <DiscoveryView 
              onConnect={handleDeviceSelect} 
              onOpenSettings={() => setShowSettings(true)} 
            />
          ) : (
            currentDevice && (
              <RemoteView 
                device={currentDevice} 
                onDisconnect={handleDisconnect} 
                settings={settings}
              />
            )
          )}
        </div>

        {showPairing && pairingDevice && (
          <PairingModal 
            device={pairingDevice}
            isConnecting={isConnecting}
            onConfirm={(pin) => attemptConnection(pairingDevice, pin)}
            onCancel={() => { setShowPairing(false); setPairingDevice(null); setPairingError(undefined); setIsConnecting(false); }}
            error={pairingError}
          />
        )}

        {showSettings && (
          <SettingsModal 
            settings={settings}
            onUpdate={setSettings}
            onClose={() => setShowSettings(false)}
            onClearData={handleClearData}
          />
        )}

      </div>
    </div>
  );
}