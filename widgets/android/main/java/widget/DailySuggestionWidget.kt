package com.ecrin.jewelry.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.SharedPreferences
import android.graphics.Color
import android.widget.RemoteViews
import android.app.PendingIntent
import android.content.Intent
import android.net.Uri
import org.json.JSONObject
import org.json.JSONArray

/**
 * Daily Suggestion Widget for L'Écrin Virtuel
 * Displays jewelry recommendations based on weather and events
 */
class DailySuggestionWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        // Update each widget instance
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onEnabled(context: Context) {
        // Called when the first widget is created
    }

    override fun onDisabled(context: Context) {
        // Called when the last widget is removed
    }

    companion object {
        private const val PREFS_NAME = "EcrinWidgetPrefs"
        private const val KEY_WIDGET_DATA = "widgetData"

        /**
         * Update a single widget instance
         */
        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            // Load widget data from SharedPreferences
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val widgetDataJson = prefs.getString(KEY_WIDGET_DATA, null)
            
            // Get the widget size
            val options = appWidgetManager.getAppWidgetOptions(appWidgetId)
            val minWidth = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH)
            val minHeight = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT)
            
            // Choose layout based on size
            val layoutId = when {
                minWidth >= 250 && minHeight >= 180 -> R.layout.widget_large
                minWidth >= 180 -> R.layout.widget_medium
                else -> R.layout.widget_small
            }
            
            val views = RemoteViews(context.packageName, layoutId)
            
            // Parse and display data
            if (widgetDataJson != null) {
                try {
                    val data = JSONObject(widgetDataJson)
                    populateWidget(views, data, layoutId)
                } catch (e: Exception) {
                    populateDefaultWidget(views, layoutId)
                }
            } else {
                populateDefaultWidget(views, layoutId)
            }
            
            // Set up click intent to open app
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("ecrin://notifications"))
            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)
            
            // Update the widget
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        /**
         * Populate widget views with data
         */
        private fun populateWidget(views: RemoteViews, data: JSONObject, layoutId: Int) {
            // Weather
            val weatherIcon = data.optString("weatherIcon", "☀️")
            val weatherTemp = data.optInt("weatherTemp", 20)
            views.setTextViewText(R.id.weather_icon, weatherIcon)
            views.setTextViewText(R.id.weather_temp, "${weatherTemp}°")
            
            // Metal recommendation
            val recommendedMetal = data.optString("recommendedMetal", "Or")
            views.setTextViewText(R.id.recommended_metal, recommendedMetal)
            
            // For medium and large widgets
            if (layoutId != R.layout.widget_small) {
                val eventIcon = data.optString("eventIcon", "📅")
                val eventName = data.optString("eventName", "Journée normale")
                views.setTextViewText(R.id.event_icon, eventIcon)
                views.setTextViewText(R.id.event_name, eventName)
                
                val mainTip = data.optString("mainTip", "Portez vos bijoux préférés")
                views.setTextViewText(R.id.main_tip, mainTip)
            }
            
            // For large widget only
            if (layoutId == R.layout.widget_large) {
                val weatherDescription = data.optString("weatherDescription", "Temps agréable")
                views.setTextViewText(R.id.weather_description, weatherDescription)
                
                val lookInspiration = data.optString("lookInspiration", "L'élégance du quotidien")
                views.setTextViewText(R.id.look_inspiration, lookInspiration)
                
                // Jewelry recommendations
                val jewelryArray = data.optJSONArray("recommendedJewelry") ?: JSONArray()
                val jewelryList = mutableListOf<String>()
                for (i in 0 until minOf(jewelryArray.length(), 3)) {
                    jewelryList.add(jewelryArray.optString(i, ""))
                }
                views.setTextViewText(R.id.jewelry_list, jewelryList.joinToString(" • "))
            }
        }

        /**
         * Populate widget with default values
         */
        private fun populateDefaultWidget(views: RemoteViews, layoutId: Int) {
            views.setTextViewText(R.id.weather_icon, "☀️")
            views.setTextViewText(R.id.weather_temp, "20°")
            views.setTextViewText(R.id.recommended_metal, "Or")
            
            if (layoutId != R.layout.widget_small) {
                views.setTextViewText(R.id.event_icon, "📅")
                views.setTextViewText(R.id.event_name, "Journée normale")
                views.setTextViewText(R.id.main_tip, "Portez vos bijoux préférés")
            }
            
            if (layoutId == R.layout.widget_large) {
                views.setTextViewText(R.id.weather_description, "Temps agréable")
                views.setTextViewText(R.id.look_inspiration, "L'élégance du quotidien")
                views.setTextViewText(R.id.jewelry_list, "Collier • Boucles • Bracelet")
            }
        }

        /**
         * Save widget data to SharedPreferences
         */
        fun saveWidgetData(context: Context, data: String) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit().putString(KEY_WIDGET_DATA, data).apply()
        }
    }
}
