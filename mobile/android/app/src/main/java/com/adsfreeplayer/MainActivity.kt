package com.adsfreeplayer

import android.view.View
import android.view.ViewGroup
import android.webkit.WebView
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "AdsFreePlayer"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  /**
   * Walk the entire view hierarchy and collect all WebView instances.
   * react-native-webview embeds a WebView deep in the RN view tree.
   */
  private fun collectWebViews(root: View, result: MutableList<WebView>) {
    if (root is WebView) { result.add(root); return }
    if (root is ViewGroup) {
      for (i in 0 until root.childCount) collectWebViews(root.getChildAt(i), result)
    }
  }

  /**
   * Called when the app is backgrounded. react-native-webview's LifecycleEventListener
   * fires onHostPause() → mWebView.onPause() which:
   *  1. Calls pauseTimers() — suspends all JS execution
   *  2. Pauses the native HTML5 <video> element via WebCore
   * We counter-act both by calling resumeTimers() AND onResume() on every WebView
   * so audio continues playing in the background.
   */
  override fun onPause() {
    super.onPause()
    val webViews = mutableListOf<WebView>()
    window.decorView.rootView?.let { collectWebViews(it, webViews) }
    if (webViews.isEmpty()) {
      // Fallback: use a dummy instance just for the global resumeTimers() call
      WebView(applicationContext).also { it.resumeTimers(); it.destroy() }
    } else {
      webViews.forEach { wv ->
        wv.resumeTimers()
        wv.onResume()
      }
    }
  }
}

