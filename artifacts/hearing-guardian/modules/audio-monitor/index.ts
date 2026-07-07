/**
 * AudioMonitor — TypeScript interface for the Kotlin Native Module.
 *
 * This file defines the contract between React Native and the Kotlin Event Engine.
 * In Expo Go / development: events are simulated via the UI controls.
 * In EAS Build (native): the Kotlin module (android/.../AudioMonitorModule.kt)
 * sends real system events.
 *
 * Kotlin responsibilities (pure event bridge only):
 *   - Listen to Android system events (headset plug, Bluetooth SCO, audio device changes)
 *   - Forward them as EventEmitter events to React Native
 *   - Zero app logic in Kotlin
 *
 * Events emitted:
 *   - onHeadsetConnected    { source: 'bluetooth' | 'wired' }
 *   - onHeadsetDisconnected { source: 'bluetooth' | 'wired' }
 *   - onAudioPlaybackStarted  {}
 *   - onAudioPlaybackStopped  {}
 *
 * Only available on Android. iOS and web always run in simulation mode
 * (see isNativeMode below), since the app's supported platform is Android
 * (see app.json → expo.android.package).
 */

import { requireOptionalNativeModule, EventEmitter } from 'expo-modules-core';
import { Platform } from 'react-native';
import { AudioEvent } from '@/types';

type HeadsetSource = 'bluetooth' | 'wired';

interface AudioMonitorNativeModule {
  startMonitoring(): Promise<void>;
  stopMonitoring(): Promise<void>;
  getHeadsetState(): Promise<{ connected: boolean; source?: HeadsetSource }>;
}

// requireOptionalNativeModule returns null instead of throwing when the
// native module isn't present (e.g. Expo Go, iOS, web) — this keeps the
// simulation fallback working exactly as before.
const nativeModule =
  Platform.OS === 'android'
    ? requireOptionalNativeModule<AudioMonitorNativeModule>('AudioMonitorModule')
    : null;

const isNativeAvailable = nativeModule != null;

class AudioMonitorModuleClass {
  private emitter: EventEmitter<Record<string, any>> | null = null;

  constructor() {
    if (isNativeAvailable && nativeModule) {
      this.emitter = new EventEmitter(nativeModule as any);
    }
  }

  async startMonitoring(): Promise<void> {
    if (isNativeAvailable && nativeModule) {
      await nativeModule.startMonitoring();
    }
  }

  async stopMonitoring(): Promise<void> {
    if (isNativeAvailable && nativeModule) {
      await nativeModule.stopMonitoring();
    }
  }

  async getHeadsetState(): Promise<{
    connected: boolean;
    source?: HeadsetSource;
  }> {
    if (isNativeAvailable && nativeModule) {
      return nativeModule.getHeadsetState();
    }
    return { connected: false };
  }

  onEvent(callback: (event: AudioEvent) => void): () => void {
    if (!isNativeAvailable || !this.emitter) {
      return () => {};
    }

    const subs = [
      this.emitter.addListener('onHeadsetConnected', (data: { source?: HeadsetSource }) =>
        callback({ type: 'headset_connected', timestamp: Date.now(), source: data?.source })
      ),
      this.emitter.addListener('onHeadsetDisconnected', (data: { source?: HeadsetSource }) =>
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
