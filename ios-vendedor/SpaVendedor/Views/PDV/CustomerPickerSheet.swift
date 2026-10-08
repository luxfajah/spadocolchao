import SwiftUI

public struct CustomerPickerSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(AppState.self) private var appState

    @State private var searchText = ""
    @State private var isRefreshing = false
    @State private var showRegisterSheet = false
    @State private var searchTask: Task<Void, Never>? = nil

    public let onSelect: (Customer) -> Void

    public init(onSelect: @escaping (Customer) -> Void) {
        self.onSelect = onSelect
    }

    private var filteredCustomers: [Customer] {
        let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if query.isEmpty {
            return appState.customers
        }

        let digitsQuery = query.filter(\.isNumber)

        return appState.customers.filter { c in
            // Nome e Razão Social
            if c.fullName.lowercased().contains(query) { return true }
            if let trade = c.tradeName, trade.lowercased().contains(query) { return true }

            // Documento (CPF / CNPJ)
            if let doc = c.document {
                if doc.lowercased().contains(query) { return true }
                if !digitsQuery.isEmpty && doc.filter(\.isNumber).contains(digitsQuery) { return true }
            }

            // Telefones
            if let phone = c.phone {
                if phone.contains(query) { return true }
                if !digitsQuery.isEmpty && phone.filter(\.isNumber).contains(digitsQuery) { return true }
            }
            if let wpp = c.whatsapp {
                if wpp.contains(query) { return true }
                if !digitsQuery.isEmpty && wpp.filter(\.isNumber).contains(digitsQuery) { return true }
            }

            // Endereço
            if let city = c.addressCity, city.lowercased().contains(query) { return true }
            if let neigh = c.addressNeighborhood, neigh.lowercased().contains(query) { return true }
            if let street = c.addressStreet, street.lowercased().contains(query) { return true }

            return false
        }
    }

    public var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Barra de Status / Contagem
                HStack {
                    HStack(spacing: 6) {
                        Image(systemName: "person.2.fill")
                            .font(.caption2)
                            .foregroundStyle(.blue)
                        if searchText.isEmpty {
                            Text("\(appState.customers.count) clientes cadastrados")
                                .font(.caption.bold())
                                .foregroundStyle(.secondary)
                        } else {
                            Text("\(filteredCustomers.count) de \(appState.customers.count) clientes")
                                .font(.caption.bold())
                                .foregroundStyle(.blue)
                        }
                    }

                    Spacer()

                    if isRefreshing {
                        ProgressView()
                            .scaleEffect(0.7)
                    } else {
                        Button(action: refreshCustomers) {
                            HStack(spacing: 4) {
                                Image(systemName: "arrow.clockwise")
                                    .font(.caption2)
                                Text("Atualizar")
                                    .font(.caption2.bold())
                            }
                            .foregroundStyle(.secondary)
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(Color(uiColor: .secondarySystemBackground))

                // Lista de Clientes
                if filteredCustomers.isEmpty {
                    emptySearchResultsView
                } else {
                    List {
                        ForEach(filteredCustomers) { customer in
                            customerRow(customer)
                                .contentShape(Rectangle())
                                .onTapGesture {
                                    onSelect(customer)
                                    dismiss()
                                }
                        }
                    }
                    .listStyle(.plain)
                    .refreshable {
                        await reloadDataAsync()
                    }
                }
            }
            .navigationTitle("Selecionar Cliente")
            .navigationBarTitleDisplayMode(.inline)
            .searchable(
                text: $searchText,
                placement: .navigationBarDrawer(displayMode: .always),
                prompt: "Buscar por nome, CPF/CNPJ, fone, cidade..."
            )
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Fechar") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button(action: { showRegisterSheet = true }) {
                        HStack(spacing: 4) {
                            Image(systemName: "person.badge.plus")
                            Text("Novo")
                                .bold()
                        }
                    }
                }
            }
            .sheet(isPresented: $showRegisterSheet) {
                RegisterCustomerSheet { newCustomer in
                    onSelect(newCustomer)
                    dismiss()
                }
            }
        }
    }

    // MARK: - Linha do Cliente
    @ViewBuilder
    private func customerRow(_ customer: Customer) -> some View {
        let isSelected = appState.selectedCustomer?.id == customer.id

        HStack(alignment: .center, spacing: 12) {
            // Avatar Inicial
            ZStack {
                Circle()
                    .fill(isSelected ? Color.blue : Color.blue.opacity(0.12))
                    .frame(width: 44, height: 44)

                Text(customerInitials(customer.fullName))
                    .font(.subheadline.bold())
                    .foregroundStyle(isSelected ? Color.white : Color.blue)
            }

            // Dados Principais
            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 6) {
                    Text(customer.fullName)
                        .font(.subheadline.bold())
                        .foregroundStyle(.primary)
                        .lineLimit(1)

                    if customer.isCompany {
                        Text("PJ")
                            .font(.system(size: 9, weight: .black))
                            .padding(.horizontal, 5)
                            .padding(.vertical, 2)
                            .background(Color.purple.opacity(0.12))
                            .foregroundStyle(.purple)
                            .clipShape(Capsule())
                    }
                }

                if let trade = customer.tradeName, !trade.isEmpty {
                    Text(trade)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }

                HStack(spacing: 8) {
                    if let doc = customer.document, !doc.isEmpty {
                        Label(formatDocumentDisplay(doc, isCompany: customer.isCompany), systemImage: "doc.text.fill")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }

                    if let phone = customer.whatsapp ?? customer.phone, !phone.isEmpty {
                        Label(phone, systemImage: "phone.fill")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }

                if !customer.formattedAddress.isEmpty && customer.formattedAddress != "Endereço não informado" {
                    Label(customer.formattedAddress, systemImage: "mappin.circle.fill")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }

            Spacer()

            if isSelected {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(Color.blue)
                    .font(.title3)
            } else {
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }
        }
        .padding(.vertical, 4)
    }

    // MARK: - Estado Vazio
    private var emptySearchResultsView: some View {
        VStack(spacing: 16) {
            Spacer()

            Image(systemName: "person.crop.circle.badge.questionmark")
                .font(.system(size: 56))
                .foregroundStyle(.secondary.opacity(0.6))

            VStack(spacing: 6) {
                Text("Nenhum cliente encontrado")
                    .font(.headline)
                    .foregroundStyle(.primary)

                Text("Não encontramos resultados para \"\(searchText)\".")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }

            Button(action: { showRegisterSheet = true }) {
                HStack(spacing: 6) {
                    Image(systemName: "plus.circle.fill")
                    Text("Cadastrar Novo Cliente")
                        .bold()
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
                .background(Color.blue)
                .foregroundStyle(.white)
                .clipShape(Capsule())
                .shadow(color: Color.blue.opacity(0.3), radius: 6, x: 0, y: 3)
            }
            .padding(.top, 8)

            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Helpers
    private func customerInitials(_ name: String) -> String {
        let parts = name.split(separator: " ").filter { !$0.isEmpty }
        if parts.count >= 2 {
            let first = parts[0].prefix(1)
            let second = parts[1].prefix(1)
            return "\(first)\(second)".uppercased()
        } else if let first = parts.first {
            return String(first.prefix(2)).uppercased()
        }
        return "CL"
    }

    private func formatDocumentDisplay(_ doc: String, isCompany: Bool) -> String {
        let clean = doc.filter(\.isNumber)
        if clean.count == 11 {
            return "CPF: \(doc)"
        } else if clean.count == 14 {
            return "CNPJ: \(doc)"
        }
        return doc
    }

    private func refreshCustomers() {
        Task {
            await reloadDataAsync()
        }
    }

    private func reloadDataAsync() async {
        isRefreshing = true
        defer { isRefreshing = false }
        do {
            let (_, fetchedCustomers) = try await APIClient.shared.fetchPDVInit()
            await MainActor.run {
                appState.customers = fetchedCustomers
            }
        } catch {
            print("Erro ao atualizar clientes: \(error)")
        }
    }
}
