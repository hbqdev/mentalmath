package dev.hbq.mentalmath;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // The app has its own text-size slider; do not compound it with the system font scale,
    // which the WebView would otherwise apply to every element as a text zoom.
    getBridge().getWebView().getSettings().setTextZoom(100);
  }
}
