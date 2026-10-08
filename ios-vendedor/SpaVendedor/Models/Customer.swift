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

    public static let sampleCustomers: [Customer] = [
        Customer(
            id: "cust_01",
            fullName: "Mariana Alencar Guimarães",
            document: "123.456.789-00",
            phone: "(11) 98765-4321",
            whatsapp: "11987654321",
            addressCity: "São Paulo",
            addressNeighborhood: "Moema",
            addressStreet: "Av. Moema",
            addressNumber: "450"
        ),
        Customer(
            id: "cust_02",
            fullName: "Roberto Mendes Silva",
            document: "987.654.321-11",
            phone: "(11) 97654-3210",
            whatsapp: "11976543210",
            addressCity: "São Paulo",
            addressNeighborhood: "Jardins",
            addressStreet: "Rua Oscar Freire",
            addressNumber: "1280"
        ),
        Customer(
            id: "cust_03",
            fullName: "Hotel Vila Primavera (Pousada)",
            document: "12.345.678/0001-90",
            phone: "(11) 3210-9876",
            whatsapp: "11999887766",
            addressCity: "Campos do Jordão",
            addressNeighborhood: "Capivari",
            addressStreet: "Av. Macedo Soares",
            addressNumber: "100"
        )
    ]
}

extension Sequence where Element == String {
    func join(_ separator: String) -> String {
        self.joined(separator: separator)
    }
}
