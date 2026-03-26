import ExpoModulesCore
import WidgetKit

public class ExpoWidgetsModule: Module {
    public func definition() -> ModuleDefinition {
        Name("EcrinWidget")
        
        // Function to update widget data from React Native
        Function("updateWidgetData") { (data: String) -> Bool in
            let userDefaults = UserDefaults(suiteName: "group.space.manus.ecrin")
            userDefaults?.set(data, forKey: "widgetData")
            userDefaults?.synchronize()
            
            // Request widget refresh
            if #available(iOS 14.0, *) {
                WidgetCenter.shared.reloadAllTimelines()
            }
            
            return true
        }
        
        // Function to get current widget data
        Function("getWidgetData") { () -> String? in
            let userDefaults = UserDefaults(suiteName: "group.space.manus.ecrin")
            return userDefaults?.string(forKey: "widgetData")
        }
        
        // Function to reload widgets
        Function("reloadWidgets") { () -> Void in
            if #available(iOS 14.0, *) {
                WidgetCenter.shared.reloadAllTimelines()
            }
        }
    }
}
