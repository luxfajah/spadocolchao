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

    public static let sampleVisits: [Visit] = [
        Visit(
            id: "vis_01",
            clientName: "Pousada Morada dos Pássaros",
            clientPhone: "(11) 98877-6655",
            clientAddress: "Rua das Hortênsias, 240, Atibaia - SP",
            visitDate: ISO8601DateFormatter().string(from: Date().addingTimeInterval(3600 * 2)),
            status: "SCHEDULED",
            notes: "Avaliação técnica de 12 colchões para reforma e troca de tecido impermeável.",
            customerId: nil
        ),
        Visit(
            id: "vis_02",
            clientName: "Dr. Gustavo Arantes (Clínica)",
            clientPhone: "(11) 97766-5544",
            clientAddress: "Av. Brigadeiro Faria Lima, 2000, Sala 84, São Paulo - SP",
            visitDate: ISO8601DateFormatter().string(from: Date().addingTimeInterval(86400 * 1)),
            status: "SCHEDULED",
            notes: "Orçamento para 3 macas ortopédicas personalizadas com espuma D45.",
            customerId: nil
        ),
        Visit(
            id: "vis_03",
            clientName: "Cláudia & Fernando Rezende",
            clientPhone: "(11) 96655-4433",
            clientAddress: "Alameda dos Anapurus, 750, Moema, São Paulo - SP",
            visitDate: ISO8601DateFormatter().string(from: Date().addingTimeInterval(-86400 * 2)),
            status: "COMPLETED",
            notes: "Visita residencial concluída. Fecharam reforma de 1 Queen e 2 travesseiros.",
            customerId: "cust_01"
        )
    ]
}
