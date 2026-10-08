import Foundation

public struct Visit: Codable, Identifiable, Hashable {
    public let id: String
    public let clientName: String
    public let clientPhone: String?
    public let clientAddress: String?
    public let visitDate: String
    public var status: String // SCHEDULED, COMPLETED, CANCELLED
    public let notes: String?
    public let customerId: String?

    public init(
        id: String = UUID().uuidString,
        clientName: String,
        clientPhone: String? = nil,
        clientAddress: String? = nil,
        visitDate: String = ISO8601DateFormatter().string(from: Date()),
        status: String = "SCHEDULED",
        notes: String? = nil,
        customerId: String? = nil
    ) {
        self.id = id
        self.clientName = clientName
        self.clientPhone = clientPhone
        self.clientAddress = clientAddress
        self.visitDate = visitDate
        self.status = status
        self.notes = notes
        self.customerId = customerId
    }

    public var isCompleted: Bool {
        status == "COMPLETED"
    }

    public var formattedDate: String {
        let formatter = ISO8601DateFormatter()
        if let date = formatter.date(from: visitDate) {
            let display = DateFormatter()
            display.locale = Locale(identifier: "pt_BR")
            display.dateStyle = .medium
            display.timeStyle = .short
            return display.string(from: date)
        }
        return visitDate
    }

    public static let sampleVisits: [Visit] = []
}
