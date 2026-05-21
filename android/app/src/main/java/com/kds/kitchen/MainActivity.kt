package com.kds.kitchen

import android.media.AudioAttributes
import android.media.SoundPool
import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.core.view.WindowCompat
import com.kds.kitchen.ui.KitchenScreen
import com.kds.kitchen.ui.theme.KdsTheme
import com.kds.kitchen.viewmodel.KitchenViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: KitchenViewModel by viewModels()

    // ── SoundPool — loud, reliable audio for kitchen environments ─────────────
    private var soundPool   : SoundPool? = null
    private var chimeSoundId: Int        = 0
    private var chimeLoaded : Boolean    = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Keep screen always on — kitchen tablets should never sleep mid-service
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        WindowCompat.setDecorFitsSystemWindows(window, false)

        // ── Init SoundPool ────────────────────────────────────────────────────
        val audioAttributes = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()

        soundPool = SoundPool.Builder()
            .setMaxStreams(3)
            .setAudioAttributes(audioAttributes)
            .build()
            .also { pool ->
                pool.setOnLoadCompleteListener { _, _, status ->
                    if (status == 0) chimeLoaded = true
                }
                // Load chime.mp3 from res/raw
                chimeSoundId = pool.load(this, R.raw.chime, 1)
            }

        setContent {
            KdsTheme {
                KitchenScreen(
                    viewModel   = viewModel,
                    onNewTicket = ::playChime,
                )
            }
        }
    }

    /**
     * Plays the chime at full volume using SoundPool.
     * SoundPool.play() is non-blocking and handles concurrent calls gracefully.
     */
    private fun playChime() {
        if (chimeLoaded) {
            soundPool?.play(
                chimeSoundId,
                /* leftVolume  */ 1.0f,
                /* rightVolume */ 1.0f,
                /* priority    */ 1,
                /* loop        */ 0,       // no loop
                /* rate        */ 1.0f,
            )
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        soundPool?.release()
        soundPool = null
    }
}
