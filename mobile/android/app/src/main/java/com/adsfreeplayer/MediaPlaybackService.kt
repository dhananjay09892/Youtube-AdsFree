package com.adsfreeplayer

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.session.MediaSession
import android.media.session.PlaybackState
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

/**
 * MediaPlaybackService â€” foreground service that keeps audio alive while the
 * WebView is playing in the background on Android.
 *
 * Mirrors what iOS achieves automatically through AVAudioSession:
 *  - Requests AudioFocus on start so other apps duck/pause correctly.
 *  - Listens for AUDIO_BECOMING_NOISY (headphone unplug) and stops gracefully.
 *  - Re-requests focus after a transient loss (phone call ends).
 *
 * Start via ACTION_START (with optional EXTRA_TITLE / EXTRA_ARTIST).
 * Stop via ACTION_STOP.
 */
class MediaPlaybackService : Service() {

    companion object {
        const val ACTION_START = "com.adsfreeplayer.action.START_PLAYBACK"
        const val ACTION_STOP  = "com.adsfreeplayer.action.STOP_PLAYBACK"
        const val EXTRA_TITLE  = "com.adsfreeplayer.extra.TITLE"
        const val EXTRA_ARTIST = "com.adsfreeplayer.extra.ARTIST"

        private const val CHANNEL_ID      = "adsfreeplayer_playback"
        private const val NOTIFICATION_ID = 1001
    }

    private var mediaSession: MediaSession? = null
    private var audioManager: AudioManager? = null
    private var focusRequest: AudioFocusRequest? = null

    // Headphone-unplug receiver â€” matches iOS interrupt handling
    private val noisyReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == AudioManager.ACTION_AUDIO_BECOMING_NOISY) {
                stopSelf()
            }
        }
    }
    private var noisyReceiverRegistered = false

    // AudioFocus callback â€” matches iOS AVAudioSessionInterruptionNotification
    private val focusChangeListener = AudioManager.OnAudioFocusChangeListener { change ->
        when (change) {
            AudioManager.AUDIOFOCUS_LOSS -> stopSelf()
            AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> {
                // Brief interruption (e.g. phone call); keep service alive â€” the
                // WebView JS visibility shim will pause the video automatically.
            }
            AudioManager.AUDIOFOCUS_GAIN -> {
                // Regained focus after transient loss; WebView resumes via JS.
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
        createNotificationChannel()

        mediaSession = MediaSession(this, "AdsFreePlayer").apply {
            setPlaybackState(
                PlaybackState.Builder()
                    .setState(PlaybackState.STATE_PLAYING, 0L, 1f)
                    .setActions(PlaybackState.ACTION_PLAY_PAUSE or PlaybackState.ACTION_STOP)
                    .build()
            )
            isActive = true
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                abandonAudioFocus()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
                return START_NOT_STICKY
            }
            else -> {
                val title  = intent?.getStringExtra(EXTRA_TITLE)  ?: "Playing"
                val artist = intent?.getStringExtra(EXTRA_ARTIST) ?: "AdsFree Player"
                requestAudioFocus()
                registerNoisyReceiver()
                startForeground(NOTIFICATION_ID, buildNotification(title, artist))
            }
        }
        return START_STICKY
    }

    override fun onDestroy() {
        abandonAudioFocus()
        unregisterNoisyReceiver()
        mediaSession?.release()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    // -----------------------------------------------------------------------
    // Audio focus (matches iOS AVAudioSession)
    // -----------------------------------------------------------------------

    private fun requestAudioFocus() {
        val am = audioManager ?: return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val attrs = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_MOVIE)
                .build()
            val req = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(attrs)
                .setOnAudioFocusChangeListener(focusChangeListener)
                .setWillPauseWhenDucked(false)
                .build()
            focusRequest = req
            am.requestAudioFocus(req)
        } else {
            @Suppress("DEPRECATION")
            am.requestAudioFocus(
                focusChangeListener,
                AudioManager.STREAM_MUSIC,
                AudioManager.AUDIOFOCUS_GAIN
            )
        }
    }

    private fun abandonAudioFocus() {
        val am = audioManager ?: return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            focusRequest?.let { am.abandonAudioFocusRequest(it) }
        } else {
            @Suppress("DEPRECATION")
            am.abandonAudioFocus(focusChangeListener)
        }
        focusRequest = null
    }

    // -----------------------------------------------------------------------
    // Noisy receiver (headphone unplug)
    // -----------------------------------------------------------------------

    private fun registerNoisyReceiver() {
        if (!noisyReceiverRegistered) {
            val filter = IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY)
            registerReceiver(noisyReceiver, filter)
            noisyReceiverRegistered = true
        }
    }

    private fun unregisterNoisyReceiver() {
        if (noisyReceiverRegistered) {
            unregisterReceiver(noisyReceiver)
            noisyReceiverRegistered = false
        }
    }

    // -----------------------------------------------------------------------
    // Notification
    // -----------------------------------------------------------------------

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Media Playback",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows while audio is playing in the background"
                setShowBadge(false)
            }
            getSystemService(NotificationManager::class.java)?.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(title: String, artist: String): Notification {
        val stopIntent = Intent(this, MediaPlaybackService::class.java).apply { action = ACTION_STOP }
        val stopPi = PendingIntent.getService(
            this, 0, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val openIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val openPi = PendingIntent.getActivity(
            this, 0, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentTitle(title)
            .setContentText(artist)
            .setContentIntent(openPi)
            .addAction(android.R.drawable.ic_media_pause, "Stop", stopPi)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setSilent(true)
            .build()
    }
}
