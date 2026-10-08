import SwiftUI

public struct BrandHeader: View {
    public let title: String
    public let subtitle: String?
    public var showOnlineBadge: Bool = true
    public var isOffline: Bool = false
    public var isTestMode: Bool = false

    public init(title: String, subtitle: String? = nil, showOnlineBadge: Bool = true, isOffline: Bool = false, isTestMode: Bool = false) {
        self.title = title
        self.subtitle = subtitle
        self.showOnlineBadge = showOnlineBadge
        self.isOffline = isOffline
        self.isTestMode = isTestMode
    }

    public var body: some View {
        HStack(alignment: .center) {
            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.title2.weight(.bold))
                    .foregroundStyle(.primary)

                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            if isTestMode {
                HStack(spacing: 4) {
                    Image(systemName: "flask.fill")
                        .font(.system(size: 9))
                    Text("SANDBOX")
                        .font(.system(size: 9, weight: .black))
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.orange.opacity(0.15))
                .foregroundStyle(Color.orange)
                .clipShape(Capsule())
            }

            if showOnlineBadge {
                HStack(spacing: 6) {
                    Circle()
                        .fill(isOffline ? Color.amber : Color.emerald)
                        .frame(width: 8, height: 8)
                    Text(isOffline ? "Offline" : "Online")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(isOffline ? Color.amber : Color.emerald)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 4)
                .background((isOffline ? Color.amber : Color.emerald).opacity(0.12))
                .clipShape(Capsule())
            }
        }
    }
}
