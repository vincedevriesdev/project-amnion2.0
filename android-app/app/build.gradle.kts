plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "net.opik.amnion"
    compileSdk = 35

    defaultConfig {
        applicationId = "net.opik.amnion"
        minSdk = 26
        targetSdk = 35
        versionCode = 2
        versionName = "2.0.0"
        base.archivesName.set("Amnion-VPN-${versionName}")

        buildConfigField("String", "NL_API_URL", "\"https://nl.amnion.webredirect.org:9443/api/v1/mobile\"")
        buildConfigField("String", "DE_API_URL", "\"https://amnion.webredirect.org:9443/api/v1/mobile\"")
    }

    val signingStore = providers.environmentVariable("AMNION_SIGNING_STORE_FILE").orNull
    val signingPassword = providers.environmentVariable("AMNION_SIGNING_STORE_PASSWORD").orNull
    val signingKeyAlias = providers.environmentVariable("AMNION_SIGNING_KEY_ALIAS").orNull
    val signingKeyPassword = providers.environmentVariable("AMNION_SIGNING_KEY_PASSWORD").orNull
    val releaseSigning = if (
        signingStore != null && signingPassword != null &&
        signingKeyAlias != null && signingKeyPassword != null
    ) {
        signingConfigs.create("releaseFromEnvironment") {
            storeFile = file(signingStore)
            storePassword = signingPassword
            keyAlias = signingKeyAlias
            keyPassword = signingKeyPassword
        }
    } else null

    buildTypes {
        debug {
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            releaseSigning?.let { signingConfig = it }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    buildFeatures {
        compose = true
        buildConfig = true
    }
    packaging {
        resources.excludes += setOf("META-INF/DEPENDENCIES", "META-INF/LICENSE*", "META-INF/NOTICE*")
        jniLibs.useLegacyPackaging = true
    }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.12.01"))
    implementation("androidx.activity:activity-compose:1.10.0")
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
    implementation("com.github.singbox-android:libbox:1.14.0")
    debugImplementation("androidx.compose.ui:ui-tooling")
}
