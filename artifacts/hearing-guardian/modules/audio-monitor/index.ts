/**
 * AudioMonitor — TypeScript interface for the Kotlin Native Module.
 *
 * This file defines the contract between React Native and the Kotlin Event Engine.
 * In Expo Go / development: events are simulated via the UI controls.
 * In EAS Build (native): the Kotlin module sends real system events.
 *
 * Kotlin responsibilities (pure event bridge only):
 *   - Listen to Android system events
 *   - Forward them as EventEmitter events to React Native
 *   - Zero app logic in Kotlin
 *
 * Events emitted:
 *   - onHeadsetConnected    { source: 'bluetooth' | 'wired' }
 *   - onHeadsetDisconnected { source: 'bluetooth' | 'wired' }
 *   - onAudioPlaybackStarted  {}
 *   - onAudioPlaybackStopped  {}
 */

import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { AudioEvent } from '@/types';

const { AudioMonitorModule } = NativeModules;

const isNativeAvailable =
  Platform.OS === 'android' && AudioMonitorModule != null;

class AudioMonitorModuleClass {
  private emitter: NativeEventEmitter | null = null;

  constructor() {
    if (isNativeAvailable) {
      this.emitter = new NativeEventEmitter(AudioMonitorModule);
    }
  }

  async startMonitoring(): Promise<void> {
    if (isNativeAvailable && AudioMonitorModule?.startMonitoring) {
      await AudioMonitorModule.startMonitoring();
    }
  }

  async stopMonitoring(): Promise<void> {
    if (isNativeAvailable && AudioMonitorModule?.stopMonitoring) {
      await AudioMonitorModule.stopMonitoring();
    }
  }

  async getHeadsetState(): Promise<{
    connected: boolean;
    source?: 'bluetooth' | 'wired';
  }> {
    if (isNativeAvailable && AudioMonitorModule?.getHeadsetState) {
      return AudioMonitorModule.getHeadsetState();
    }
    return { connected: false };
  }

  onEvent(callback: (event: AudioEvent) => void): () => void {
    if (!isNativeAvailable || !this.emitter) {
      return () => {};
    }

    const subs = [
      this.emitter.addListener('onHeadsetConnected', (data) =>
        callback({ type: 'headset_connected', timestamp: Date.now(), source: data?.source })
      ),
      this.emitter.addListener('onHeadsetDisconnected', (data) =>
        callback({ type: 'headset_disconnected', timestamp: Date.now(), source: data?.source })
      ),
      this.emitter.addListener('onAudioPlaybackStarted', () =>
        callback({ type: 'audio_started', timestamp: Date.now() })
      ),
      this.emitter.addListener('onAudioPlaybackStopped', () =>
        callback({ type: 'audio_stopped', timestamp: Date.now() })
      ),
    ];

    return () => subs.forEach((s) => s.remove());
  }

  get isNativeMode(): boolean {
    return isNativeAvailable;
  }
}

export const audioMonitor = new AudioMonitorModuleClass();
export default audioMonitor;
