import SwiftUI

public struct StatusBadge: View {
    public let title: String
    public let icon: String
    public let color: Color

    public init(title: String, icon: String, color: Color) {
        self.title = title
        self.icon = icon
        self.color = color
    }

    public var body: some View {
        HStack(spacing: 5) {
            Image(systemName: icon)
                .font(.caption2.bold())
            Text(title)
                .font(.caption.weight(.semibold))
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 4)
        .foregroundStyle(color)
        .background(color.opacity(0.12))
        .clipShape(Capsule())
    }
}
