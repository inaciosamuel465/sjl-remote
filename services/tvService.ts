import { DiscoveredDevice, DeviceType, KeyCode, AppPermissionStatus } from '../types';

// This service now supports both a Mock/Demo mode and a Real mode that connects to a backend bridge.
// Since browsers cannot do raw TCP (ADB) directly, a backend bridge (Node.js) is required for "Real" mode.

class TvService {
  private isConnected: boolean = false;
  private currentDevice: DiscoveredDevice | null = null;
  private permissionStatus: AppPermissionStatus = AppPermissionStatus.UNKNOWN;
  private authorizedDevices: Set<string> = new Set(); 
  
  // Configuration
  private demoMode: boolean = true;
  private backendUrl: string = 'http://localhost:3001';
  
  // Real Crypto Keys
  private keyPair: CryptoKeyPair | null = null;

  private mockDevices: DiscoveredDevice[] = [
    {
      id: '1',
      name: 'Living Room TV',
      ip: '192.168.1.45',
      port: 5555,
      type: DeviceType.ANDROID_TV,
      latency: 12,
      requiresPin: false
    },
    {
      id: '2',
      name: 'Bedroom TCL',
      ip: '192.168.1.88',
      port: 5555,
      type: DeviceType.TCL_TV,
      latency: 45,
      requiresPin: true
    },
    {
      id: '3',
      name: 'Office Chromecast',
      ip: '192.168.1.102',
      port: 8009,
      type: DeviceType.CHROMECAST,
      latency: 20,
      requiresPin: false
    }
  ];

  constructor() {
    // Initialize Key Pair generation in background for real ADB handshake preparation
    this.generateAdbKeys();
  }

  public configure(demoMode: boolean, backendUrl: string) {
    this.demoMode = demoMode;
    this.backendUrl = backendUrl.replace(/\/$/, ''); // remove trailing slash
  }

  private async generateAdbKeys() {
    try {
      if (!window.crypto || !window.crypto.subtle) return;
      this.keyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSASSA-PKCS1-v1_5",
          modulusLength: 2048,
          publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
          hash: { name: "SHA-256" },
        },
        true,
        ["sign", "verify"]
      );
      console.log("[TvService] RSA Keys generated for real ADB handshake");
    } catch (e) {
      console.error("[TvService] Failed to generate crypto keys", e);
    }
  }

  async requestPermissions(): Promise<boolean> {
    // REAL Implementation: Trigger Browser Location Prompt
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        console.warn("Geolocation not supported");
        this.permissionStatus = AppPermissionStatus.DENIED;
        resolve(false); // Don't crash, just deny
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("[TvService] Location Access Granted:", position.coords);
          this.permissionStatus = AppPermissionStatus.GRANTED;
          resolve(true);
        },
        (error) => {
          console.error("[TvService] Location Access Denied:", error);
          this.permissionStatus = AppPermissionStatus.DENIED;
          reject(error);
        },
        { timeout: 10000, enableHighAccuracy: false }
      );
    });
  }

  getPermissionStatus() {
    return this.permissionStatus;
  }

  async scanForDevices(): Promise<DiscoveredDevice[]> {
    if (this.permissionStatus !== AppPermissionStatus.GRANTED) {
      throw new Error("PERMISSION_DENIED");
    }

    if (this.demoMode) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([...this.mockDevices]);
        }, 2500);
      });
    } else {
      // REAL Mode: Call backend bridge
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${this.backendUrl}/api/discover`, {
          signal: controller.signal
        });
        clearTimeout(id);
        
        if (!response.ok) throw new Error("Backend Scan Failed");
        const devices = await response.json();
        return devices;
      } catch (e) {
        console.error("Real scan failed, check backend connection", e);
        throw new Error("NETWORK_ERROR");
      }
    }
  }

  async getDeviceById(id: string): Promise<DiscoveredDevice | undefined> {
    if (this.demoMode) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(this.mockDevices.find(d => d.id === id));
        }, 500);
      });
    } else {
      // Optimistic real implementation: we would normally cache the last scan
      // For now we return undefined to force a fresh scan if not cached in UI
      return undefined;
    }
  }

  async connectToDevice(
    device: DiscoveredDevice, 
    pin?: string, 
    onStatusChange?: (status: string) => void
  ): Promise<boolean> {
    
    onStatusChange?.('CONNECTING');

    if (this.demoMode) {
       // ... Mock Implementation ...
       await this.delay(800);
       if (device.requiresPin && !pin) throw new Error('PIN_REQUIRED');
       if (device.requiresPin && pin !== '123456') throw new Error('INVALID_PIN');

       if (!this.authorizedDevices.has(device.id)) {
         onStatusChange?.('WAITING_FOR_AUTH');
         await this.delay(3000); 
         this.authorizedDevices.add(device.id);
       }

       this.isConnected = true;
       this.currentDevice = device;
       onStatusChange?.('CONNECTED');
       return true;
    } else {
       // REAL Mode: Connect via Bridge
       try {
         const response = await fetch(`${this.backendUrl}/api/connect`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ 
             ip: device.ip, 
             port: device.port,
             pin,
             publicKey: this.keyPair ? "KEY_EXPORT_PLACEHOLDER" : null // In real app, export PEM
           })
         });

         if (response.status === 401) {
           // 401 from backend means "Needs Auth"
           onStatusChange?.('WAITING_FOR_AUTH');
           // Poll for auth completion
           await this.pollForAuth(device.ip);
         } else if (!response.ok) {
           const err = await response.json();
           throw new Error(err.code || 'CONNECTION_FAILED');
         }

         this.isConnected = true;
         this.currentDevice = device;
         onStatusChange?.('CONNECTED');
         return true;
       } catch (e: any) {
         throw e;
       }
    }
  }

  // Helper for Real Mode polling
  private async pollForAuth(ip: string): Promise<void> {
    const maxAttempts = 20;
    for (let i = 0; i < maxAttempts; i++) {
      await this.delay(2000);
      const res = await fetch(`${this.backendUrl}/api/status?ip=${ip}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'connected') return;
        if (data.status === 'failed') throw new Error('AUTH_DENIED');
      }
    }
    throw new Error('AUTH_TIMEOUT');
  }

  async sendCommand(code: KeyCode): Promise<void> {
    if (!this.isConnected) throw new Error("Not Connected");
    
    if (this.demoMode) {
      console.log(`[ADB] Sending KeyCode: ${code} to ${this.currentDevice?.ip}`);
      await this.delay(50);
    } else {
      await fetch(`${this.backendUrl}/api/key`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ 
           ip: this.currentDevice?.ip,
           code: code
         })
      });
    }
  }

  async sendText(text: string): Promise<void> {
    if (!this.isConnected) throw new Error("Not Connected");
    
    if (this.demoMode) {
       console.log(`[ADB] Sending Text: "${text}"`);
       await this.delay(100);
    } else {
       await fetch(`${this.backendUrl}/api/text`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ 
           ip: this.currentDevice?.ip,
           text: text
         })
      });
    }
  }

  async sendTouch(x: number, y: number, type: 'tap' | 'swipe'): Promise<void> {
     if (!this.isConnected) return;
     
     if (this.demoMode) {
       if (type === 'tap') console.log(`[ADB] Input Tap: ${x} ${y}`);
     } else {
        // Fire and forget for performance
        fetch(`${this.backendUrl}/api/touch`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ ip: this.currentDevice?.ip, x, y, type })
        }).catch(() => {});
     }
  }

  async sendMouseDelta(dx: number, dy: number): Promise<void> {
    if (!this.isConnected) return;
    
    if (!this.demoMode) {
        fetch(`${this.backendUrl}/api/mouse`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ ip: this.currentDevice?.ip, dx, dy })
        }).catch(() => {});
    }
  }
  
  getMockApps() {
    return [
      { id: 'yt', name: 'YouTube', packageName: 'com.google.android.youtube', icon: 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg' },
      { id: 'nf', name: 'Netflix', packageName: 'com.netflix.ninja', icon: 'https://upload.wikimedia.org/wikipedia/commons/7/75/Netflix_icon.svg' },
      { id: 'sp', name: 'Spotify', packageName: 'com.spotify.tv.android', icon: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg' },
      { id: 'tw', name: 'Twitch', packageName: 'tv.twitch.android.app', icon: 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Twitch_Glitch_Logo_Purple.svg' },
      { id: 'pl', name: 'Plex', packageName: 'com.plexapp.android', icon: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Plex_logo_2022.svg' },
    ];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const tvService = new TvService();
