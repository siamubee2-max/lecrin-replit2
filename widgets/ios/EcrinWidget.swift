import WidgetKit
import SwiftUI

// MARK: - Data Models

struct WidgetData: Codable {
    let weatherIcon: String
    let weatherTemp: Int
    let weatherCondition: String
    let weatherDescription: String
    let eventIcon: String
    let eventName: String
    let eventType: String
    let mainTip: String
    let shortTip: String
    let recommendedJewelry: [String]
    let recommendedMetal: String
    let lookInspiration: String
    let moodKeyword: String
    let date: String
    let lastUpdated: String
    let deepLink: String
}

// MARK: - Timeline Entry

struct EcrinEntry: TimelineEntry {
    let date: Date
    let widgetData: WidgetData
    
    static var placeholder: EcrinEntry {
        EcrinEntry(
            date: Date(),
            widgetData: WidgetData(
                weatherIcon: "☀️",
                weatherTemp: 20,
                weatherCondition: "sunny",
                weatherDescription: "Ensoleillé",
                eventIcon: "📅",
                eventName: "Journée normale",
                eventType: "none",
                mainTip: "Portez vos bijoux préférés aujourd'hui",
                shortTip: "Portez vos bijoux préférés",
                recommendedJewelry: ["Collier", "Boucles d'oreilles"],
                recommendedMetal: "Or",
                lookInspiration: "L'élégance du quotidien",
                moodKeyword: "classique",
                date: "2025-01-10",
                lastUpdated: "2025-01-10T08:00:00Z",
                deepLink: "ecrin://notifications"
            )
        )
    }
}

// MARK: - Timeline Provider

struct EcrinProvider: TimelineProvider {
    func placeholder(in context: Context) -> EcrinEntry {
        EcrinEntry.placeholder
    }
    
    func getSnapshot(in context: Context, completion: @escaping (EcrinEntry) -> Void) {
        let entry = loadWidgetData() ?? EcrinEntry.placeholder
        completion(entry)
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<EcrinEntry>) -> Void) {
        var entries: [EcrinEntry] = []
        let currentDate = Date()
        
        // Load current data
        let currentEntry = loadWidgetData() ?? EcrinEntry.placeholder
        
        // Generate entries for the next 24 hours, one per hour
        for hourOffset in 0..<24 {
            let entryDate = Calendar.current.date(byAdding: .hour, value: hourOffset, to: currentDate)!
            let entry = EcrinEntry(date: entryDate, widgetData: currentEntry.widgetData)
            entries.append(entry)
        }
        
        // Refresh at the end of the timeline
        let timeline = Timeline(entries: entries, policy: .atEnd)
        completion(timeline)
    }
    
    private func loadWidgetData() -> EcrinEntry? {
        guard let userDefaults = UserDefaults(suiteName: "group.space.manus.ecrin"),
              let jsonString = userDefaults.string(forKey: "widgetData"),
              let jsonData = jsonString.data(using: .utf8) else {
            return nil
        }
        
        do {
            let widgetData = try JSONDecoder().decode(WidgetData.self, from: jsonData)
            return EcrinEntry(date: Date(), widgetData: widgetData)
        } catch {
            print("Failed to decode widget data: \(error)")
            return nil
        }
    }
}

// MARK: - Widget Views

struct SmallWidgetView: View {
    let entry: EcrinEntry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            // Weather row
            HStack {
                Text(entry.widgetData.weatherIcon)
                    .font(.title2)
                Text("\(entry.widgetData.weatherTemp)°")
                    .font(.title3)
                    .fontWeight(.semibold)
                Spacer()
            }
            
            Spacer()
            
            // Metal recommendation
            Text(entry.widgetData.recommendedMetal)
                .font(.headline)
                .foregroundColor(.yellow)
            
            // Short tip
            Text(entry.widgetData.shortTip)
                .font(.caption)
                .foregroundColor(.secondary)
                .lineLimit(2)
        }
        .padding()
        .background(
            LinearGradient(
                gradient: Gradient(colors: [Color(hex: "1a365d"), Color(hex: "2c5282")]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .foregroundColor(.white)
    }
}

struct MediumWidgetView: View {
    let entry: EcrinEntry
    
    var body: some View {
        HStack(spacing: 12) {
            // Left side - Weather & Event
            VStack(alignment: .leading, spacing: 8) {
                // Weather
                HStack {
                    Text(entry.widgetData.weatherIcon)
                        .font(.title)
                    VStack(alignment: .leading) {
                        Text("\(entry.widgetData.weatherTemp)°")
                            .font(.title2)
                            .fontWeight(.bold)
                        Text(entry.widgetData.weatherDescription)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                // Event
                HStack {
                    Text(entry.widgetData.eventIcon)
                        .font(.title3)
                    Text(entry.widgetData.eventName)
                        .font(.subheadline)
                        .lineLimit(1)
                }
            }
            
            Divider()
                .background(Color.white.opacity(0.3))
            
            // Right side - Recommendation
            VStack(alignment: .leading, spacing: 4) {
                Text("Bijoux du jour")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Text(entry.widgetData.recommendedMetal)
                    .font(.headline)
                    .foregroundColor(.yellow)
                
                ForEach(entry.widgetData.recommendedJewelry.prefix(2), id: \.self) { jewelry in
                    Text("• \(jewelry)")
                        .font(.caption)
                }
                
                Spacer()
            }
        }
        .padding()
        .background(
            LinearGradient(
                gradient: Gradient(colors: [Color(hex: "1a365d"), Color(hex: "2c5282")]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .foregroundColor(.white)
    }
}

struct LargeWidgetView: View {
    let entry: EcrinEntry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                Image(systemName: "sparkles")
                    .foregroundColor(.yellow)
                Text("L'Écrin Virtuel")
                    .font(.headline)
                Spacer()
                Text(entry.widgetData.weatherIcon)
                Text("\(entry.widgetData.weatherTemp)°")
                    .fontWeight(.semibold)
            }
            
            Divider()
                .background(Color.white.opacity(0.3))
            
            // Event
            HStack {
                Text(entry.widgetData.eventIcon)
                    .font(.title2)
                VStack(alignment: .leading) {
                    Text(entry.widgetData.eventName)
                        .font(.subheadline)
                        .fontWeight(.medium)
                    Text(entry.widgetData.weatherDescription)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                Spacer()
            }
            
            // Main tip
            Text(entry.widgetData.mainTip)
                .font(.subheadline)
                .foregroundColor(.white.opacity(0.9))
                .lineLimit(2)
            
            // Jewelry recommendations
            VStack(alignment: .leading, spacing: 4) {
                Text("Recommandations")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                HStack {
                    Text(entry.widgetData.recommendedMetal)
                        .font(.caption)
                        .fontWeight(.semibold)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.yellow.opacity(0.3))
                        .cornerRadius(8)
                    
                    ForEach(entry.widgetData.recommendedJewelry.prefix(3), id: \.self) { jewelry in
                        Text(jewelry)
                            .font(.caption)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.white.opacity(0.2))
                            .cornerRadius(8)
                    }
                }
            }
            
            Spacer()
            
            // Inspiration
            HStack {
                Text("💡")
                Text(entry.widgetData.lookInspiration)
                    .font(.caption)
                    .italic()
                    .foregroundColor(.white.opacity(0.8))
            }
        }
        .padding()
        .background(
            LinearGradient(
                gradient: Gradient(colors: [Color(hex: "1a365d"), Color(hex: "2c5282")]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .foregroundColor(.white)
    }
}

// MARK: - Widget Configuration

struct EcrinWidget: Widget {
    let kind: String = "EcrinWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: EcrinProvider()) { entry in
            EcrinWidgetEntryView(entry: entry)
                .widgetURL(URL(string: entry.widgetData.deepLink))
        }
        .configurationDisplayName("L'Écrin Virtuel")
        .description("Votre suggestion de bijoux du jour")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

struct EcrinWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: EcrinEntry
    
    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(entry: entry)
        case .systemMedium:
            MediumWidgetView(entry: entry)
        case .systemLarge:
            LargeWidgetView(entry: entry)
        default:
            SmallWidgetView(entry: entry)
        }
    }
}

// MARK: - Widget Bundle

@main
struct EcrinWidgetBundle: WidgetBundle {
    var body: some Widget {
        EcrinWidget()
    }
}

// MARK: - Color Extension

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// MARK: - Preview

struct EcrinWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            SmallWidgetView(entry: EcrinEntry.placeholder)
                .previewContext(WidgetPreviewContext(family: .systemSmall))
            
            MediumWidgetView(entry: EcrinEntry.placeholder)
                .previewContext(WidgetPreviewContext(family: .systemMedium))
            
            LargeWidgetView(entry: EcrinEntry.placeholder)
                .previewContext(WidgetPreviewContext(family: .systemLarge))
        }
    }
}
