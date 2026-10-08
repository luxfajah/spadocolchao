import Foundation
import CoreLocation
import Observation

@Observable
public final class LocationManager: NSObject, CLLocationManagerDelegate {
    public static let shared = LocationManager()

    private let manager = CLLocationManager()
    public var lastLocation: CLLocation?
    public var authorizationStatus: CLAuthorizationStatus = .notDetermined

    override private init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyHundredMeters
        authorizationStatus = manager.authorizationStatus
    }

    public func requestAuthorization() {
        manager.requestWhenInUseAuthorization()
    }

    public func startUpdating() {
        manager.startUpdatingLocation()
    }

    public func stopUpdating() {
        manager.stopUpdatingLocation()
    }

    // MARK: - Delegate
    public func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        authorizationStatus = manager.authorizationStatus
        #if os(iOS)
        if authorizationStatus == .authorizedWhenInUse || authorizationStatus == .authorizedAlways {
            manager.startUpdatingLocation()
        }
        #else
        if authorizationStatus == .authorizedAlways {
            manager.startUpdatingLocation()
        }
        #endif
    }

    public func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        self.lastLocation = location
    }

    public func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        // Silently handle location error
    }
}
