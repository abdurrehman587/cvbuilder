package com.getglory.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register plugin BEFORE calling super.onCreate
        // This ensures the plugin is available when the bridge initializes
        registerPlugin(FileDownloadPlugin.class);
        
        super.onCreate(savedInstanceState);
    }
}
