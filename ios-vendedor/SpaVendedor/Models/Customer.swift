import Foundation

public struct Customer: Codable, Identifiable, Hashable {
    public let id: String
    public var personType: String // "INDIVIDUAL" ou "COMPANY"
    public var fullName: String
    public var tradeName: String?
    public var document: String?
    public var rg: String?
    public var birthDate: String?
    public var email: String?
    public var phone: String?
    public var whatsapp: String?
    public var notes: String?
    public var zipCode: String?
    public var addressStreet: String?
    public var addressNumber: String?
    public var addressComplement: String?
    public var addressNeighborhood: String?
    public var addressCity: String?
    public var addressState: String?

    public init(
        id: String = UUID().uuidString,
        personType: String = "INDIVIDUAL",
        fullName: String,
        tradeName: String? = nil,
        document: String? = nil,
        rg: String? = nil,
        birthDate: String? = nil,
        email: String? = nil,
        phone: String? = nil,
        whatsapp: String? = nil,
        notes: String? = nil,
        zipCode: String? = nil,
        addressStreet: String? = nil,
        addressNumber: String? = nil,
        addressComplement: String? = nil,
        addressNeighborhood: String? = nil,
        addressCity: String? = nil,
        addressState: String? = nil
    ) {
        self.id = id
        self.personType = personType
        self.fullName = fullName
        self.tradeName = tradeName
        self.document = document
        self.rg = rg
        self.birthDate = birthDate
        self.email = email
        self.phone = phone
        self.whatsapp = whatsapp
        self.notes = notes
        self.zipCode = zipCode
        self.addressStreet = addressStreet
        self.addressNumber = addressNumber
        self.addressComplement = addressComplement
        self.addressNeighborhood = addressNeighborhood
        self.addressCity = addressCity
        self.addressState = addressState
    }

    public var isCompany: Bool {
        personType == "COMPANY"
    }

    public var formattedAddress: String {
        var parts: [String] = []

        if let street = addressStreet, !street.isEmpty {
            if let num = addressNumber, !num.isEmpty {
                parts.append("\(street), nº \(num)")
            } else {
                parts.append(street)
            }
        }

        if let comp = addressComplement, !comp.isEmpty {
            parts.append(comp)
        }

        if let neigh = addressNeighborhood, !neigh.isEmpty {
            parts.append(neigh)
        }

        if let city = addressCity, !city.isEmpty {
            if let state = addressState, !state.isEmpty {
                parts.append("\(city) - \(state)")
            } else {
                parts.append(city)
            }
        }

        if let cep = zipCode, !cep.isEmpty {
            parts.append("CEP \(cep)")
        }

        return parts.isEmpty ? "Endereço não informado" : parts.joined(separator: " • ")
    }

    public static let sampleCustomers: [Customer] = []
}

extension Sequence where Element == String {
    func join(_ separator: String) -> String {
        self.joined(separator: separator)
    }
}
