import SwiftUI

public struct NewVisitSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(AppState.self) private var appState

    @State private var clientName = ""
    @State private var clientPhone = ""
    @State private var clientAddress = ""
    @State private var visitDate = Date().addingTimeInterval(3600 * 2) // Em 2 horas
    @State private var notes = ""

    public let onSave: (Visit) -> Void

    public init(onSave: @escaping (Visit) -> Void) {
        self.onSave = onSave
    }

    public var body: some View {
        NavigationStack {
            Form {
                Section("Dados do Cliente / Local") {
                    TextField("Nome do Cliente ou Empresa", text: $clientName)
                    TextField("Telefone / WhatsApp", text: $clientPhone)
                        .keyboardType(.phonePad)
                    TextField("Endereço Completo (com cidade)", text: $clientAddress)
                }

                Section("Agendamento") {
                    DatePicker("Data e Horário", selection: $visitDate, displayedComponents: [.date, .hourAndMinute])
                }

                Section("Objetivo da Visita") {
                    TextField("Ex: Orçamento para reforma de 5 colchões, medição de box sob medida...", text: $notes)
                }
            }
            .navigationTitle("Nova Visita")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Salvar") {
                        let newVisit = Visit(
                            clientName: clientName.isEmpty ? "Cliente Presencial" : clientName,
                            clientPhone: clientPhone,
                            clientAddress: clientAddress,
                            visitDate: ISO8601DateFormatter().string(from: visitDate),
                            status: "SCHEDULED",
                            notes: notes
                        )
                        onSave(newVisit)
                        dismiss()
                    }
                    .bold()
                    .disabled(clientName.isEmpty && clientAddress.isEmpty)
                }
            }
        }
    }
}
