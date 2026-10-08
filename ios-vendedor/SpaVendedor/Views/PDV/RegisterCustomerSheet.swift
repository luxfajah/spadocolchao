import SwiftUI

public struct RegisterCustomerSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(AppState.self) private var appState

    // Tipo de Pessoa
    @State private var personType: String = "INDIVIDUAL" // "INDIVIDUAL" ou "COMPANY"

    // Dados Cadastrais
    @State private var fullName: String = ""
    @State private var tradeName: String = ""
    @State private var document: String = ""
    @State private var rg: String = ""
    @State private var birthDate: Date = Calendar.current.date(byAdding: .year, value: -30, to: Date()) ?? Date()
    @State private var hasBirthDate: Bool = false

    // Contato
    @State private var whatsapp: String = ""
    @State private var phone: String = ""
    @State private var email: String = ""

    // Endereço Completo
    @State private var zipCode: String = ""
    @State private var addressStreet: String = ""
    @State private var addressNumber: String = ""
    @State private var addressComplement: String = ""
    @State private var addressNeighborhood: String = ""
    @State private var addressCity: String = ""
    @State private var addressState: String = "PR"

    // Observações
    @State private var notes: String = ""

    // Estados de UI
    @State private var isSearchingCep: Bool = false
    @State private var isSaving: Bool = false
    @State private var errorMessage: String? = nil
    @State private var showErrorAlert: Bool = false

    public let onCustomerCreated: (Customer) -> Void

    public init(onCustomerCreated: @escaping (Customer) -> Void) {
        self.onCustomerCreated = onCustomerCreated
    }

    private var isCompany: Bool {
        personType == "COMPANY"
    }

    public var body: some View {
        NavigationStack {
            Form {
                // SEÇÃO 1: TIPO DE PESSOA
                Section {
                    Picker("Tipo de Cadastro", selection: $personType) {
                        Text("Pessoa Física (PF)").tag("INDIVIDUAL")
                        Text("Pessoa Jurídica (PJ)").tag("COMPANY")
                    }
                    .pickerStyle(.segmented)
                    .padding(.vertical, 4)
                } header: {
                    Text("TIPO DE PESSOA")
                }

                // SEÇÃO 2: IDENTIFICAÇÃO COMPLETA
                Section {
                    if isCompany {
                        TextField("Razão Social *", text: $fullName)
                            .textContentType(.organizationName)
                        TextField("Nome Fantasia", text: $tradeName)
                        TextField("CNPJ (apenas números ou formatado) *", text: $document)
                            .keyboardType(.numbersAndPunctuation)
                            .onChange(of: document) { _, newValue in
                                document = formatCNPJ(newValue)
                            }
                        TextField("Inscrição Estadual (IE)", text: $rg)
                            .keyboardType(.numbersAndPunctuation)
                    } else {
                        TextField("Nome Completo *", text: $fullName)
                            .textContentType(.name)
                        TextField("CPF (apenas números ou formatado) *", text: $document)
                            .keyboardType(.numbersAndPunctuation)
                            .onChange(of: document) { _, newValue in
                                document = formatCPF(newValue)
                            }
                        TextField("RG / Órgão Emissor", text: $rg)

                        Toggle("Informar Data de Nascimento", isOn: $hasBirthDate)
                        if hasBirthDate {
                            DatePicker("Data de Nascimento", selection: $birthDate, displayedComponents: .date)
                                .datePickerStyle(.compact)
                        }
                    }
                } header: {
                    Text(isCompany ? "DADOS EMPRESARIAIS" : "IDENTIFICAÇÃO CIVIL")
                } footer: {
                    Text("O preenchimento completo de nome e documento garante a emissão do pedido e nota fiscal.")
                        .font(.caption2)
                }

                // SEÇÃO 3: CONTATO E COMUNICAÇÃO
                Section {
                    HStack {
                        Image(systemName: "phone.bubble.fill")
                            .foregroundStyle(Color.emerald)
                        TextField("WhatsApp / Celular *", text: $whatsapp)
                            .keyboardType(.phonePad)
                            .textContentType(.telephoneNumber)
                            .onChange(of: whatsapp) { _, newValue in
                                whatsapp = formatPhone(newValue)
                            }
                    }

                    HStack {
                        Image(systemName: "phone.fill")
                            .foregroundStyle(.secondary)
                        TextField("Telefone Fixo (Opcional)", text: $phone)
                            .keyboardType(.phonePad)
                    }

                    HStack {
                        Image(systemName: "envelope.fill")
                            .foregroundStyle(.blue)
                        TextField("E-mail para envio de pedido", text: $email)
                            .keyboardType(.emailAddress)
                            .textContentType(.emailAddress)
                            .autocapitalization(.none)
                            .disableAutocorrection(true)
                    }
                } header: {
                    Text("CONTATO DIRETO")
                }

                // SEÇÃO 4: ENDEREÇO COMPLETO DE ENTREGA
                Section {
                    HStack {
                        TextField("CEP (00000-000)", text: $zipCode)
                            .keyboardType(.numberPad)
                            .onChange(of: zipCode) { _, newValue in
                                zipCode = formatCEP(newValue)
                            }

                        if isSearchingCep {
                            ProgressView()
                                .padding(.horizontal, 6)
                        } else {
                            Button("Buscar") {
                                searchCEP()
                            }
                            .font(.caption.bold())
                            .buttonStyle(.bordered)
                            .tint(.blue)
                            .disabled(zipCode.filter(\.isNumber).count != 8)
                        }
                    }

                    TextField("Logradouro / Rua / Av. *", text: $addressStreet)
                        .textContentType(.streetAddressLine1)

                    HStack {
                        TextField("Número *", text: $addressNumber)
                            .keyboardType(.numbersAndPunctuation)
                            .frame(maxWidth: 120)

                        TextField("Complemento (Apto, Bloco, Casa)", text: $addressComplement)
                    }

                    TextField("Bairro *", text: $addressNeighborhood)

                    HStack {
                        TextField("Cidade *", text: $addressCity)
                            .textContentType(.addressCity)
                        TextField("UF *", text: $addressState)
                            .frame(maxWidth: 60)
                            .autocapitalization(.allCharacters)
                    }
                } header: {
                    Text("ENDEREÇO DE ENTREGA E COBRANÇA")
                } footer: {
                    Text("Informe o endereço completo para cálculo de rotas e entrega da fábrica.")
                        .font(.caption2)
                }

                // SEÇÃO 5: OBSERVAÇÕES
                Section {
                    TextField("Ex: Ponto de referência, restrição de horário de entrega, cliente indicado por...", text: $notes, axis: .vertical)
                        .lineLimit(3...6)
                } header: {
                    Text("OBSERVAÇÕES ADICIONAIS")
                }
            }
            .navigationTitle("Cadastro Completo")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button(action: saveCustomer) {
                        if isSaving {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Text("Salvar Cliente")
                                .bold()
                        }
                    }
                    .disabled(isSaving || !isValidForm)
                }
            }
            .alert("Atenção", isPresented: $showErrorAlert) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(errorMessage ?? "Preencha todos os campos obrigatórios.")
            }
        }
    }

    // MARK: - Validação do Formulário
    private var isValidForm: Bool {
        let cleanName = fullName.trimmingCharacters(in: .whitespacesAndNewlines)
        let cleanDoc = document.filter(\.isNumber)
        let cleanWpp = whatsapp.filter(\.isNumber)
        let cleanStreet = addressStreet.trimmingCharacters(in: .whitespacesAndNewlines)
        let cleanNum = addressNumber.trimmingCharacters(in: .whitespacesAndNewlines)
        let cleanCity = addressCity.trimmingCharacters(in: .whitespacesAndNewlines)

        let isDocValid = isCompany ? cleanDoc.count == 14 : cleanDoc.count == 11
        return !cleanName.isEmpty && isDocValid && cleanWpp.count >= 10 && !cleanStreet.isEmpty && !cleanNum.isEmpty && !cleanCity.isEmpty
    }

    // MARK: - Salvar Cliente no Supabase
    private func saveCustomer() {
        guard isValidForm else {
            errorMessage = "Preencha Nome Completo, CPF/CNPJ válido, WhatsApp e Endereço Completo (Rua, Número e Cidade)."
            showErrorAlert = true
            return
        }

        isSaving = true
        errorMessage = nil

        let birthDateStr: String? = hasBirthDate ? ISO8601DateFormatter().string(from: birthDate) : nil

        let newCustomer = Customer(
            personType: personType,
            fullName: fullName.trimmingCharacters(in: .whitespacesAndNewlines),
            tradeName: tradeName.isEmpty ? nil : tradeName.trimmingCharacters(in: .whitespacesAndNewlines),
            document: document.filter(\.isNumber),
            rg: rg.isEmpty ? nil : rg.trimmingCharacters(in: .whitespacesAndNewlines),
            birthDate: birthDateStr,
            email: email.isEmpty ? nil : email.trimmingCharacters(in: .whitespacesAndNewlines),
            phone: phone.filter(\.isNumber).isEmpty ? nil : phone,
            whatsapp: whatsapp.filter(\.isNumber),
            notes: notes.isEmpty ? nil : notes,
            zipCode: zipCode.filter(\.isNumber),
            addressStreet: addressStreet.trimmingCharacters(in: .whitespacesAndNewlines),
            addressNumber: addressNumber.trimmingCharacters(in: .whitespacesAndNewlines),
            addressComplement: addressComplement.isEmpty ? nil : addressComplement.trimmingCharacters(in: .whitespacesAndNewlines),
            addressNeighborhood: addressNeighborhood.trimmingCharacters(in: .whitespacesAndNewlines),
            addressCity: addressCity.trimmingCharacters(in: .whitespacesAndNewlines),
            addressState: addressState.trimmingCharacters(in: .whitespacesAndNewlines)
        )

        Task {
            do {
                let saved = try await APIClient.shared.createCustomer(
                    customer: newCustomer,
                    sellerId: appState.currentUser?.sellerId
                )

                await MainActor.run {
                    appState.customers.insert(saved, at: 0)
                    appState.selectedCustomer = saved
                    onCustomerCreated(saved)
                    isSaving = false
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    isSaving = false
                    errorMessage = "Falha ao gravar no Supabase: \(error.localizedDescription)"
                    showErrorAlert = true
                }
            }
        }
    }

    // MARK: - Busca de CEP (ViaCEP)
    private func searchCEP() {
        let clean = zipCode.filter(\.isNumber)
        guard clean.count == 8 else { return }

        isSearchingCep = true
        Task {
            guard let url = URL(string: "https://viacep.com.br/ws/\(clean)/json/") else {
                isSearchingCep = false
                return
            }

            do {
                let (data, _) = try await URLSession.shared.data(from: url)
                struct ViaCepResult: Codable {
                    let logradouro: String?
                    let bairro: String?
                    let localidade: String?
                    let uf: String?
                    let erro: Bool?
                }

                let result = try JSONDecoder().decode(ViaCepResult.self, from: data)
                await MainActor.run {
                    isSearchingCep = false
                    if result.erro != true {
                        if let log = result.logradouro, !log.isEmpty { self.addressStreet = log }
                        if let bai = result.bairro, !bai.isEmpty { self.addressNeighborhood = bai }
                        if let loc = result.localidade, !loc.isEmpty { self.addressCity = loc }
                        if let uf = result.uf, !uf.isEmpty { self.addressState = uf }
                    }
                }
            } catch {
                await MainActor.run {
                    isSearchingCep = false
                }
            }
        }
    }

    // MARK: - Helpers de Máscaras
    private func formatCPF(_ value: String) -> String {
        let digits = value.filter(\.isNumber)
        let prefix = String(digits.prefix(11))
        var formatted = ""
        for (index, char) in prefix.enumerated() {
            if index == 3 || index == 6 { formatted += "." }
            if index == 9 { formatted += "-" }
            formatted.append(char)
        }
        return formatted
    }

    private func formatCNPJ(_ value: String) -> String {
        let digits = value.filter(\.isNumber)
        let prefix = String(digits.prefix(14))
        var formatted = ""
        for (index, char) in prefix.enumerated() {
            if index == 2 || index == 5 { formatted += "." }
            if index == 8 { formatted += "/" }
            if index == 12 { formatted += "-" }
            formatted.append(char)
        }
        return formatted
    }

    private func formatPhone(_ value: String) -> String {
        let digits = value.filter(\.isNumber)
        let prefix = String(digits.prefix(11))
        var formatted = ""
        for (index, char) in prefix.enumerated() {
            if index == 0 { formatted += "(" }
            if index == 2 { formatted += ") " }
            if prefix.count == 11 && index == 7 { formatted += "-" }
            if prefix.count < 11 && index == 6 { formatted += "-" }
            formatted.append(char)
        }
        return formatted
    }

    private func formatCEP(_ value: String) -> String {
        let digits = value.filter(\.isNumber)
        let prefix = String(digits.prefix(8))
        var formatted = ""
        for (index, char) in prefix.enumerated() {
            if index == 5 { formatted += "-" }
            formatted.append(char)
        }
        return formatted
    }
}
