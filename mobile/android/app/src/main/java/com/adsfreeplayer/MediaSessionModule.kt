package com.adsfreeplayer

import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

/**
 * MediaSessionModule — React Native bridge module that lets JS start/stop
 * the [MediaPlaybackService] foreground service for background audio on
 * Android.
 *
 * JS usage:
 *   import { NativeModules } from 'react-native';
 *   const { MediaSession } = NativeModules;
 *   MediaSession.startPlayback({ title: 'My Video', artist: 'Channel Name' });
 *   MediaSession.stopPlayback();
 */
class MediaSessionModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "MediaSession"

    @ReactMethod
    fun startPlayback(metadata: ReadableMap) {
        val title  = if (metadata.hasKey("title"))  metadata.getString("title")  else "Playing"
        val artist = if (metadata.hasKey("artist")) metadata.getString("artist") else "AdsFree Player"

        val intent = Intent(reactContext, MediaPlaybackService::class.java).apply {
            action = MediaPlaybackService.ACTION_START
            putExtra(MediaPlaybackService.EXTRA_TITLE,  title)
            putExtra(MediaPlaybackService.EXTRA_ARTIST, artist)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            reactContext.startForegroundService(intent)
        } else {
            reactContext.startService(intent)
        }
    }

    @ReactMethod
    fun stopPlayback() {
        val intent = Intent(reactContext, MediaPlaybackService::class.java).apply {
            action = MediaPlaybackService.ACTION_STOP
        }
        reactContext.startService(intent)
    }
}
