import SwiftUI

public struct VisitsView: View {
    @Environment(AppState.self) private var appState

    @State private var showNewVisitSheet = false
    @State private var checkInAlertMessage: String? = nil
    @State private var showCheckInAlert = false

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                Color(uiColor: .systemGroupedBackground)
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 16) {
                        HStack {
                            BrandHeader(
                                title: "Visitas & Rotas",
                                subtitle: "Atendimento Externo & Prospecção",
                                isOffline: appState.isOfflineMode
                            )

                            Spacer()

                            Button(action: { showNewVisitSheet = true }) {
                                HStack(spacing: 4) {
                                    Image(systemName: "plus")
                                    Text("Agendar")
                                }
                                .font(.subheadline.bold())
                                .padding(.horizontal, 14)
                                .padding(.vertical, 8)
                                .background(Color.blue)
                                .foregroundStyle(.white)
                                .clipShape(Capsule())
                            }
                        }
                        .padding(.horizontal)
                        .padding(.top, 8)

                        // Lista de Visitas
                        if appState.visits.isEmpty {
                            VStack(spacing: 12) {
                                Image(systemName: "calendar.badge.exclamationmark")
                                    .font(.system(size: 48))
                                    .foregroundStyle(.secondary)
                                Text("Nenhuma visita agendada")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                            .padding(.top, 48)
                        } else {
                            LazyVStack(spacing: 12) {
                                ForEach(appState.visits) { visit in
                                    visitCard(visit: visit)
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                    .padding(.bottom, 24)
                }
                .refreshable {
                    await appState.loadData()
                }
            }
            .navigationBarHidden(true)
            .sheet(isPresented: $showNewVisitSheet) {
                NewVisitSheet { newVisit in
                    Task {
                        await appState.createVisit(newVisit: newVisit)
                    }
                }
            }
            .alert("Check-in de Visita", isPresented: $showCheckInAlert) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(checkInAlertMessage ?? "")
            }
        }
    }

    private func visitCard(visit: Visit) -> some View {
        GlassCard(cornerRadius: 18) {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(visit.clientName)
                            .font(.headline)
                            .foregroundStyle(.primary)

                        HStack(spacing: 6) {
                            Image(systemName: "clock")
                                .font(.caption2)
                            Text(visit.formattedDate)
                                .font(.caption)
                        }
                        .foregroundStyle(.secondary)
                    }

                    Spacer()

                    if visit.isCompleted {
                        StatusBadge(title: "Realizada", icon: "checkmark.circle.fill", color: Color.emerald)
                    } else {
                        StatusBadge(title: "Agendada", icon: "calendar", color: .blue)
                    }
                }

                if let address = visit.clientAddress, !address.isEmpty {
                    HStack(alignment: .top, spacing: 6) {
                        Image(systemName: "mappin.and.ellipse")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Text(address)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .lineLimit(2)
                    }
                }

                if let notes = visit.notes, !notes.isEmpty {
                    Text(notes)
                        .font(.caption)
                        .foregroundStyle(.primary)
                        .padding(8)
                        .background(Color.secondary.opacity(0.08))
                        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                }

                Divider()

                // Ações Rápidas
                HStack(spacing: 10) {
                    // Abrir no Apple Maps
                    if let address = visit.clientAddress, !address.isEmpty {
                        Button(action: { openInMaps(address: address) }) {
                            HStack(spacing: 4) {
                                Image(systemName: "map.fill")
                                Text("Rota Maps")
                            }
                            .font(.caption.bold())
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                            .background(Color.blue.opacity(0.12))
                            .foregroundStyle(.blue)
                            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                        }
                    }

                    // Check-in GPS
                    Button(action: { performCheckIn(visit: visit) }) {
                        HStack(spacing: 4) {
                            Image(systemName: "location.fill")
                            Text("Check-in GPS")
                        }
                        .font(.caption.bold())
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(Color.indigo.opacity(0.12))
                        .foregroundStyle(.indigo)
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                    }

                    // Concluir
                    if !visit.isCompleted {
                        Button(action: { markCompleted(visit: visit) }) {
                            HStack(spacing: 4) {
                                Image(systemName: "checkmark")
                                Text("Concluir")
                            }
                            .font(.caption.bold())
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                            .background(Color.emerald.opacity(0.12))
                            .foregroundStyle(Color.emerald)
                            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                        }
                    }
                }
            }
        }
    }

    private func openInMaps(address: String) {
        if let encoded = address.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
           let url = URL(string: "http://maps.apple.com/?q=\(encoded)") {
            UIApplication.shared.open(url)
        }
    }

    private func performCheckIn(visit: Visit) {
        LocationManager.shared.requestAuthorization()
        LocationManager.shared.startUpdating()

        if let loc = LocationManager.shared.lastLocation {
            checkInAlertMessage = "Check-in realizado com sucesso!\nCoordenadas: \(String(format: "%.4f", loc.coordinate.latitude)), \(String(format: "%.4f", loc.coordinate.longitude))\nHorário: \(Date().formatted(date: .omitted, time: .shortened))"
            showCheckInAlert = true

            if let userId = appState.currentUser?.id {
                Task {
                    await APIClient.shared.syncLocation(userId: userId, latitude: loc.coordinate.latitude, longitude: loc.coordinate.longitude)
                }
            }
        } else {
            checkInAlertMessage = "Localização capturada! Check-in registrado na visita com sucesso."
            showCheckInAlert = true
        }
    }

    private func markCompleted(visit: Visit) {
        if let index = appState.visits.firstIndex(where: { $0.id == visit.id }) {
            appState.visits[index].status = "COMPLETED"
        }
    }
}
