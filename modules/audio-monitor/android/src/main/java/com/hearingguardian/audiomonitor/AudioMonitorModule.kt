package com.hearingguardian.audiomonitor

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.media.AudioDeviceCallback
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * AudioMonitorModule — pure event bridge only (no app logic here).
 *
 * Responsibilities:
 *   - Detect wired / Bluetooth headset connect & disconnect
 *   - Detect whether audio is actively being played through the device
 *   - Forward these as events to the JS side (see modules/audio-monitor/index.ts)
 *
 * Events emitted:
 *   - onHeadsetConnected    { source: "bluetooth" | "wired" }
 *   - onHeadsetDisconnected { source: "bluetooth" | "wired" }
 *   - onAudioPlaybackStarted  {}
 *   - onAudioPlaybackStopped  {}
 */
class AudioMonitorModule : Module() {

  private var isMonitoring = false
  private var lastHeadsetConnected = false
  private var lastHeadsetSource: String? = null
  private var lastAudioPlaying = false

  private val audioManager: AudioManager
    get() = appContext.reactContext?.getSystemService(Context.AUDIO_SERVICE) as AudioManager

  // --- Wired headset connect/disconnect (sticky broadcast) ---
  private val wiredHeadsetReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      val state = intent.getIntExtra("state", -1)
      if (state == -1) return
      val connected = state == 1
      handleHeadsetChange(connected, "wired")
    }
  }

  // --- Bluetooth SCO / A2DP connect/disconnect ---
  private val bluetoothReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      when (intent.action) {
        AudioManager.ACTION_SCO_AUDIO_STATE_UPDATED -> {
          val state = intent.getIntExtra(
            AudioManager.EXTRA_SCO_AUDIO_STATE,
            AudioManager.SCO_AUDIO_STATE_ERROR
          )
          val connected = state == AudioManager.SCO_AUDIO_STATE_CONNECTED
          handleHeadsetChange(connected, "bluetooth")
        }
      }
    }
  }

  // --- Audio device callback (API 23+): more reliable cross-check for both wired & BT ---
  private val deviceCallback = object : AudioDeviceCallback() {
    override fun onAudioDevicesAdded(addedDevices: Array<out AudioDeviceInfo>) {
      addedDevices.forEach { device ->
        classifyHeadsetDevice(device)?.let { source ->
          handleHeadsetChange(true, source)
        }
      }
      refreshPlaybackState()
    }

    override fun onAudioDevicesRemoved(removedDevices: Array<out AudioDeviceInfo>) {
      removedDevices.forEach { device ->
        classifyHeadsetDevice(device)?.let { source ->
          if (!anyHeadsetStillConnected()) {
            handleHeadsetChange(false, source)
          }
        }
      }
      refreshPlaybackState()
    }
  }

  private fun classifyHeadsetDevice(device: AudioDeviceInfo): String? {
    return when (device.type) {
      AudioDeviceInfo.TYPE_WIRED_HEADSET,
      AudioDeviceInfo.TYPE_WIRED_HEADPHONES -> "wired"
      AudioDeviceInfo.TYPE_BLUETOOTH_SCO,
      AudioDeviceInfo.TYPE_BLUETOOTH_A2DP -> "bluetooth"
      else -> null
    }
  }

  private fun anyHeadsetStillConnected(): Boolean {
    val devices = audioManager.getDevices(AudioManager.GET_DEVICES_OUTPUTS)
    return devices.any { classifyHeadsetDevice(it) != null }
  }

  private fun handleHeadsetChange(connected: Boolean, source: String) {
    if (connected == lastHeadsetConnected && source == lastHeadsetSource) return
    lastHeadsetConnected = connected
    lastHeadsetSource = if (connected) source else null

    val eventName = if (connected) "onHeadsetConnected" else "onHeadsetDisconnected"
    sendEvent(eventName, mapOf("source" to source))
  }

  /**
   * Android has no direct "is audio playing" system event, so we infer it from
   * whether the device is actively routing music/media through an output that
   * is only meaningful while playback is happening (isMusicActive covers
   * MediaPlayer, ExoPlayer, and most third-party audio/video apps).
   */
  private fun refreshPlaybackState() {
    val playing = try {
      audioManager.isMusicActive
    } catch (e: Exception) {
      false
    }
    if (playing == lastAudioPlaying) return
    lastAudioPlaying = playing
    sendEvent(if (playing) "onAudioPlaybackStarted" else "onAudioPlaybackStopped", emptyMap<String, Any>())
  }

  private var pollHandler: android.os.Handler? = null
  private val pollRunnable = object : Runnable {
    override fun run() {
      if (!isMonitoring) return
      refreshPlaybackState()
      pollHandler?.postDelayed(this, 1500)
    }
  }

  private fun startPolling() {
    if (pollHandler != null) return
    pollHandler = android.os.Handler(android.os.Looper.getMainLooper())
    pollHandler?.post(pollRunnable)
  }

  private fun stopPolling() {
    pollHandler?.removeCallbacks(pollRunnable)
    pollHandler = null
  }

  override fun definition() = ModuleDefinition {
    Name("AudioMonitorModule")

    Events(
      "onHeadsetConnected",
      "onHeadsetDisconnected",
      "onAudioPlaybackStarted",
      "onAudioPlaybackStopped"
    )

    AsyncFunction("startMonitoring") {
      if (isMonitoring) return@AsyncFunction
      isMonitoring = true

      val context = appContext.reactContext ?: return@AsyncFunction

      context.registerReceiver(
        wiredHeadsetReceiver,
        IntentFilter(AudioManager.ACTION_HEADSET_PLUG)
      )
      context.registerReceiver(
        bluetoothReceiver,
        IntentFilter(AudioManager.ACTION_SCO_AUDIO_STATE_UPDATED)
      )

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        audioManager.registerAudioDeviceCallback(deviceCallback, null)
      }

      // Seed initial state so the JS side isn't stuck at defaults until the
      // next system broadcast fires.
      if (anyHeadsetStillConnected()) {
        val devices = audioManager.getDevices(AudioManager.GET_DEVICES_OUTPUTS)
        devices.firstNotNullOfOrNull { classifyHeadsetDevice(it) }?.let { source ->
          handleHeadsetChange(true, source)
        }
      }
      refreshPlaybackState()
      startPolling()
    }

    AsyncFunction("stopMonitoring") {
      if (!isMonitoring) return@AsyncFunction
      isMonitoring = false

      val context = appContext.reactContext
      try {
        context?.unregisterReceiver(wiredHeadsetReceiver)
      } catch (e: IllegalArgumentException) {
        // Receiver was never registered — safe to ignore.
      }
      try {
        context?.unregisterReceiver(bluetoothReceiver)
      } catch (e: IllegalArgumentException) {
        // Receiver was never registered — safe to ignore.
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        audioManager.unregisterAudioDeviceCallback(deviceCallback)
      }
      stopPolling()
    }

    AsyncFunction("getHeadsetState") {
      return@AsyncFunction mapOf(
        "connected" to lastHeadsetConnected,
        "source" to lastHeadsetSource
      )
    }
  }
}
