package com.getglory.app;

import android.content.ContentValues;
import android.content.ContentResolver;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;

@CapacitorPlugin(name = "FileDownload")
public class FileDownloadPlugin extends Plugin {
    
    private static final String TAG = "FileDownloadPlugin";

    @Override
    public void load() {
        super.load();
        Log.d(TAG, "FileDownloadPlugin loaded and registered!");
    }

    @PluginMethod
    public void savePdfToDownloads(PluginCall call) {
        Log.d(TAG, "savePdfToDownloads called!");
        String base64Data = call.getString("base64Data");
        String fileName = call.getString("fileName");

        if (base64Data == null || fileName == null) {
            Log.e(TAG, "Missing base64Data or fileName");
            call.reject("Missing base64Data or fileName");
            return;
        }

        try {
            byte[] pdfBytes = Base64.decode(base64Data, Base64.DEFAULT);
            Log.d(TAG, "Decoded PDF bytes, size: " + pdfBytes.length);
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Android 10+ - Use MediaStore API
                Log.d(TAG, "Using MediaStore API for Android 10+");
                ContentResolver resolver = getContext().getContentResolver();
                
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
                values.put(MediaStore.Downloads.MIME_TYPE, "application/pdf");
                values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);

                Log.d(TAG, "Inserting file into MediaStore: " + fileName);
                Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);

                if (uri != null) {
                    Log.d(TAG, "File URI created: " + uri.toString());
                    try (OutputStream outputStream = resolver.openOutputStream(uri)) {
                        if (outputStream != null) {
                            outputStream.write(pdfBytes);
                            outputStream.flush();
                            outputStream.close();
                            
                            Log.d(TAG, "File written successfully to Downloads");
                            
                            JSObject result = new JSObject();
                            result.put("success", true);
                            result.put("uri", uri.toString());
                            result.put("path", Environment.DIRECTORY_DOWNLOADS + "/" + fileName);
                            call.resolve(result);
                            return;
                        } else {
                            Log.e(TAG, "Failed to open output stream");
                            call.reject("Failed to open output stream for file");
                            return;
                        }
                    } catch (IOException e) {
                        Log.e(TAG, "Error writing file: " + e.getMessage(), e);
                        call.reject("Error writing file: " + e.getMessage());
                        return;
                    }
                } else {
                    Log.e(TAG, "Failed to create URI in MediaStore");
                    call.reject("Failed to create file in Downloads folder");
                    return;
                }
            } else {
                // Android 9 and below - Use traditional file system
                Log.d(TAG, "Using traditional file system for Android 9 and below");
                File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                if (!downloadsDir.exists()) {
                    boolean created = downloadsDir.mkdirs();
                    Log.d(TAG, "Downloads directory created: " + created);
                }
                
                File pdfFile = new File(downloadsDir, fileName);
                Log.d(TAG, "Saving file to: " + pdfFile.getAbsolutePath());
                
                try (FileOutputStream fos = new FileOutputStream(pdfFile)) {
                    fos.write(pdfBytes);
                    fos.flush();
                    
                    Log.d(TAG, "File saved successfully to Downloads");
                    
                    JSObject result = new JSObject();
                    result.put("success", true);
                    result.put("uri", Uri.fromFile(pdfFile).toString());
                    result.put("path", pdfFile.getAbsolutePath());
                    call.resolve(result);
                } catch (IOException e) {
                    Log.e(TAG, "Error writing file: " + e.getMessage(), e);
                    call.reject("Error writing file: " + e.getMessage());
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Unexpected error: " + e.getMessage(), e);
            call.reject("Error saving file: " + e.getMessage());
        }
    }
}

