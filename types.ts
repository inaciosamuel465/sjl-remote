export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  SCANNING = 'SCANNING',
  CONNECTING = 'CONNECTING',
  WAITING_FOR_AUTH = 'WAITING_FOR_AUTH', // New status for ADB RSA Prompt
  PAIRING_REQUIRED = 'PAIRING_REQUIRED',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR'
}

export enum DeviceType {
  ANDROID_TV = 'Android TV',
  TCL_TV = 'TCL Smart TV',
  CHROMECAST = 'Chromecast'
}

export enum AppPermissionStatus {
  UNKNOWN = 'UNKNOWN',
  DENIED = 'DENIED',
  GRANTED = 'GRANTED'
}

export interface DiscoveredDevice {
  id: string;
  name: string;
  ip: string;
  port: number;
  type: DeviceType;
  latency?: number;
  requiresPin: boolean;
}

export enum KeyCode {
  POWER = 26,
  HOME = 3,
  BACK = 4,
  UP = 19,
  DOWN = 20,
  LEFT = 21,
  RIGHT = 22,
  OK = 23,
  VOLUME_UP = 24,
  VOLUME_DOWN = 25,
  MUTE = 164,
  MENU = 82,
  PLAY_PAUSE = 85,
  NETFLIX = 1001,
  YOUTUBE = 1002
}

export interface TvApp {
  id: string;
  name: string;
  icon: string; // URL or icon name
  packageName: string;
}

export interface AppSettings {
  autoConnect: boolean;
  enableHaptics: boolean;
  lastConnectedDeviceId: string | null;
  preferredDiscovery: {
    mdns: boolean;
    ssdp: boolean;
    ipScan: boolean;
  };
  keyMappings: Record<string, number>; // physical key code (e.code) -> KeyCode
  // New settings for Real Functionality
  demoMode: boolean;
  backendUrl: string;
}
