package net.opik.amnion

import android.app.Application
import io.nekohasekai.libbox.Libbox
import io.nekohasekai.libbox.SetupOptions

class AmnionApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        val working = getExternalFilesDir(null) ?: filesDir
        Libbox.setup(SetupOptions().apply {
            basePath = filesDir.path
            workingPath = working.path
            tempPath = cacheDir.path
            fixAndroidStack = true
            logMaxLines = 500
            debug = BuildConfig.DEBUG
            crashReportSource = "Amnion Android"
            appVersion = BuildConfig.VERSION_CODE.toString()
            appMarketingVersion = BuildConfig.VERSION_NAME
        })
    }
}
