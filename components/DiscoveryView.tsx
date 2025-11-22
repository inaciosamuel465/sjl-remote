import React, { useEffect, useState } from 'react';
import { DiscoveredDevice, ConnectionStatus, AppPermissionStatus } from '../types';
import { tvService } from '../services/tvService';
import { Tv, Wifi, Search, AlertCircle, Settings, MapPin, ServerOff } from 'lucide-react';
import { Button } from './Button';

interface Props {
  onConnect: (device: DiscoveredDevice) => void;
  onOpenSettings: () => void;
}

export const DiscoveryView: React.FC<Props> = ({ onConnect, onOpenSettings }) => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [permissionStatus, setPermissionStatus] = useState<AppPermissionStatus>(tvService.getPermissionStatus());
  const [devices, setDevices] = useState<DiscoveredDevice[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);

  // Check permissions on mount
  useEffect(() => {
    if (permissionStatus === AppPermissionStatus.GRANTED) {
      startScan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionStatus]);

  const handleRequestPermission = async () => {
    try {
      await tvService.requestPermissions();
      setPermissionStatus(AppPermissionStatus.GRANTED);
    } catch (e) {
      setPermissionStatus(AppPermissionStatus.DENIED);
    }
  };

  const startScan = async () => {
    setStatus(ConnectionStatus.SCANNING);
    setDevices([]);
    setScanError(null);
    try {
      const results = await tvService.scanForDevices();
      setDevices(results);
      setStatus(ConnectionStatus.DISCONNECTED); // Scan finished
    } catch (error: any) {
      console.error(error);
      setStatus(ConnectionStatus.ERROR);
      setScanError(error.message || 'Unknown error');
    }
  };

  if (permissionStatus !== AppPermissionStatus.GRANTED) {
    return (
       <div className="flex flex-col h-full p-8 items-center justify-center text-center space-y-6 animate-in zoom-in-95">
         <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center">
            <MapPin className="w-10 h-10 text-blue-500" />
         </div>
         <div>
           <h2 className="text-2xl font-bold text-white mb-2">Permission Required</h2>
           <p className="text-zinc-400">
             To discover devices on your local Wi-Fi network, this app requires access to location services.
           </p>
         </div>
         <Button variant="primary" onClick={handleRequestPermission} className="w-full max-w-xs h-12">
           Allow Location Access
         </Button>
         <p className="text-xs text-zinc-600 mt-4">
           We do not track your location. This is an Android/Browser requirement for Wi-Fi scanning.
         </p>
       </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6">
      <div className="mb-8 pt-4 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">SJL Remote</h1>
          <p className="text-zinc-400">Select a device to control</p>
        </div>
        <button 
          onClick={onOpenSettings}
          className="p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all active:scale-95"
        >
          <Settings size={20} />
        </button>
      </div>

      {status === ConnectionStatus.SCANNING ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          <div className="relative">
             <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
             <div className="relative bg-zinc-800 p-6 rounded-full border border-zinc-700">
                <Search className="w-8 h-8 text-blue-400 animate-pulse" />
             </div>
          </div>
          <p className="text-zinc-500 text-sm font-medium animate-pulse">Scanning local network...</p>
        </div>
      ) : scanError ? (
         <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-4 animate-in fade-in">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
              <ServerOff className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Connection Failed</h3>
              <p className="text-zinc-500 text-sm mt-2">
                {scanError === 'NETWORK_ERROR' 
                  ? "Could not connect to the Bridge Server." 
                  : scanError}
              </p>
            </div>
            <div className="bg-zinc-900 p-4 rounded-lg text-xs text-left w-full max-w-xs border border-zinc-800">
              <p className="text-zinc-300 font-mono mb-2">$ node backend/bridge.js</p>
              <p className="text-zinc-500">Make sure the bridge server is running on port 3001 to use Real Mode.</p>
            </div>
            <Button onClick={startScan} variant="secondary">Try Again</Button>
         </div>
      ) : (
        <div className="flex-1 overflow-y-auto -mx-2 px-2 custom-scrollbar">
           {devices.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-4">
               <AlertCircle className="w-12 h-12 opacity-50" />
               <p>No devices found</p>
               <button 
                 onClick={startScan}
                 className="text-blue-400 text-sm font-medium hover:text-blue-300"
               >
                 Try Again
               </button>
             </div>
           ) : (
             <div className="space-y-3">
               {devices.map(device => (
                 <button
                   key={device.id}
                   onClick={() => onConnect(device)}
                   className="w-full bg-zinc-800/50 hover:bg-zinc-800 active:scale-[0.98] transition-all border border-zinc-700/50 rounded-xl p-4 flex items-center space-x-4 group"
                 >
                   <div className="bg-zinc-900 p-3 rounded-lg text-zinc-400 group-hover:text-blue-400 transition-colors">
                      <Tv className="w-6 h-6" />
                   </div>
                   <div className="flex-1 text-left">
                     <h3 className="font-semibold text-zinc-100">{device.name}</h3>
                     <div className="flex items-center space-x-2 text-xs text-zinc-500">
                       <span>{device.ip}</span>
                       <span>•</span>
                       <span className="flex items-center"><Wifi className="w-3 h-3 mr-1" /> {device.latency}ms</span>
                     </div>
                   </div>
                   {device.requiresPin && (
                     <span className="px-2 py-1 bg-zinc-900 rounded text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                       PIN
                     </span>
                   )}
                 </button>
               ))}
             </div>
           )}
        </div>
      )}

      <div className="mt-auto pt-6 text-center">
         <button onClick={startScan} className="text-zinc-500 text-xs uppercase tracking-widest hover:text-white transition-colors">
            Rescan Network
         </button>
      </div>
    </div>
  );
};