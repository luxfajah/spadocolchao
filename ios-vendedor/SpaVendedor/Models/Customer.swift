import Foundation

public struct Customer: Codable, Identifiable, Hashable {
    public let id: String
    public var fullName: String
    public var document: String?
    public var phone: String?
    public var whatsapp: String?
    public var addressCity: String?
    public var addressNeighborhood: String?
    public var addressStreet: String?
    public var addressNumber: String?

    public init(
        id: String = UUID().uuidString,
        fullName: String,
        document: String? = nil,
        phone: String? = nil,
        whatsapp: String? = nil,
        addressCity: String? = nil,
        addressNeighborhood: String? = nil,
        addressStreet: String? = nil,
        addressNumber: String? = nil
    ) {
        self.id = id
        self.fullName = fullName
        self.document = document
        self.phone = phone
        self.whatsapp = whatsapp
        self.addressCity = addressCity
        self.addressNeighborhood = addressNeighborhood
        self.addressStreet = addressStreet
        self.addressNumber = addressNumber
    }

    public var formattedAddress: String {
        let parts = [addressStreet, addressNumber, addressNeighborhood, addressCity].compactMap { $0?.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
        return parts.isEmpty ? "Endereço não informado" : parts.join(", ")
    }

    public static let sampleCustomers: [Customer] = []
}

extension Sequence where Element == String {
    func join(_ separator: String) -> String {
        self.joined(separator: separator)
    }
}
