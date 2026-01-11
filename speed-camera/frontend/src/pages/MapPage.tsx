import React, { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import type { SpeedCamera, UserSettings, Subscription } from '../types';
import api from '../utils/api';
import 'mapbox-gl/dist/mapbox-gl.css';

// You'll need to set this in your environment
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

const MapPage: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isDriving, setIsDriving] = useState(false);
  const [cameras, setCameras] = useState<SpeedCamera[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertCamera, setAlertCamera] = useState<SpeedCamera | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    // Load settings and subscription status
    loadSettings();
    loadSubscription();
  }, []);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-0.1278, 51.5074], // London default
      zoom: 12
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Request location permission
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [
            position.coords.longitude,
            position.coords.latitude
          ];
          setUserLocation(coords);
          map.current?.setCenter(coords);
          addUserMarker(coords);
        },
        (error) => {
          console.error('Location error:', error);
          alert('Unable to access location. Please enable GPS.');
        }
      );
    }

    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (map.current && userLocation) {
      loadCameras();
    }
  }, [userLocation]);

  useEffect(() => {
    if (cameras.length && map.current) {
      // Add camera markers
      cameras.forEach(camera => {
        const el = document.createElement('div');
        el.className = 'camera-marker';
        el.innerHTML = getCameraIcon(camera.type);
        el.style.width = '32px';
        el.style.height = '32px';
        el.style.cursor = 'pointer';

        new mapboxgl.Marker(el)
          .setLngLat([camera.longitude, camera.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div class="p-2">
                  <p class="font-bold">${formatCameraType(camera.type)}</p>
                  ${camera.speedLimit ? `<p>Limit: ${camera.speedLimit} ${settings?.speedUnit || 'MPH'}</p>` : ''}
                </div>
              `)
          )
          .addTo(map.current!);
      });
    }
  }, [cameras, settings]);

  useEffect(() => {
    if (isDriving && userLocation) {
      checkProximityAlerts();
    }
  }, [userLocation, isDriving, cameras, settings]);

  const loadSettings = async () => {
    try {
      const response = await api.get('/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadSubscription = async () => {
    try {
      const response = await api.get('/subscriptions/status');
      setSubscription(response.data);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    }
  };

  const loadCameras = async () => {
    if (!map.current) return;

    const bounds = map.current.getBounds();
    if (!bounds) return;
    
    try {
      const response = await api.get('/cameras', {
        params: {
          minLat: bounds.getSouth(),
          maxLat: bounds.getNorth(),
          minLng: bounds.getWest(),
          maxLng: bounds.getEast()
        }
      });
      setCameras(response.data);
    } catch (error) {
      console.error('Failed to load cameras:', error);
    }
  };

  const addUserMarker = (coords: [number, number]) => {
    if (userMarker.current) {
      userMarker.current.setLngLat(coords);
    } else {
      const el = document.createElement('div');
      el.className = 'user-marker';
      el.innerHTML = '📍';
      el.style.fontSize = '32px';

      userMarker.current = new mapboxgl.Marker(el)
        .setLngLat(coords)
        .addTo(map.current!);
    }
  };

  const startDriving = () => {
    setIsDriving(true);
    
    // Track analytics
    api.post('/analytics/track', { eventType: 'DRIVING_SESSION_STARTED' });

    // Start watching position
    if ('geolocation' in navigator) {
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const coords: [number, number] = [
            position.coords.longitude,
            position.coords.latitude
          ];
          setUserLocation(coords);
          map.current?.setCenter(coords);
          addUserMarker(coords);
        },
        (error) => {
          console.error('Location error:', error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 1000
        }
      );
    }
  };

  const stopDriving = () => {
    setIsDriving(false);
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  };

  const checkProximityAlerts = () => {
    if (!userLocation || !settings) return;

    const alertDistance = subscription?.hasActiveSubscription 
      ? settings.alertDistance 
      : Math.min(settings.alertDistance, 300); // Free tier limited to 300m

    cameras.forEach(camera => {
      const distance = calculateDistance(
        userLocation[1],
        userLocation[0],
        camera.latitude,
        camera.longitude
      );

      if (distance <= alertDistance && distance > 0) {
        triggerAlert(camera);
      }
    });
  };

  const triggerAlert = (camera: SpeedCamera) => {
    setShowAlert(true);
    setAlertCamera(camera);

    // Play sound if enabled
    if (settings?.alertSound) {
      const audio = new Audio('/alert.mp3');
      audio.play().catch(e => console.error('Audio play failed:', e));
    }

    // Track analytics
    api.post('/analytics/track', { 
      eventType: 'ALERT_TRIGGERED',
      metadata: { cameraType: camera.type }
    });

    // Hide alert after 5 seconds
    setTimeout(() => {
      setShowAlert(false);
      setAlertCamera(null);
    }, 5000);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const getCameraIcon = (type: string): string => {
    switch (type) {
      case 'FIXED_SPEED': return '📷';
      case 'RED_LIGHT': return '🚦';
      case 'AVERAGE_SPEED': return '📹';
      default: return '📷';
    }
  };

  const formatCameraType = (type: string): string => {
    switch (type) {
      case 'FIXED_SPEED': return 'Fixed Speed Camera';
      case 'RED_LIGHT': return 'Red Light Camera';
      case 'AVERAGE_SPEED': return 'Average Speed Camera';
      default: return 'Speed Camera';
    }
  };

  return (
    <div className="relative h-screen w-screen bg-gray-900">
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Alert Overlay */}
      {showAlert && alertCamera && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-8 py-6 rounded-lg shadow-2xl z-50 animate-pulse">
          <div className="text-center">
            <div className="text-5xl mb-2">{getCameraIcon(alertCamera.type)}</div>
            <p className="text-2xl font-bold mb-2">SPEED CAMERA AHEAD!</p>
            <p className="text-lg">{formatCameraType(alertCamera.type)}</p>
            {alertCamera.speedLimit && (
              <p className="text-xl mt-2">Limit: {alertCamera.speedLimit} {settings?.speedUnit || 'MPH'}</p>
            )}
          </div>
        </div>
      )}

      {/* Driving Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-40">
        {!isDriving ? (
          <button
            onClick={startDriving}
            className="bg-green-600 hover:bg-green-700 text-white text-2xl font-bold py-6 px-16 rounded-full shadow-2xl transition-all transform hover:scale-105"
          >
            🚗 START DRIVING
          </button>
        ) : (
          <button
            onClick={stopDriving}
            className="bg-red-600 hover:bg-red-700 text-white text-2xl font-bold py-6 px-16 rounded-full shadow-2xl transition-all transform hover:scale-105"
          >
            ⏹️ STOP DRIVING
          </button>
        )}
      </div>

      {/* Top Menu Button */}
      <div className="absolute top-4 right-4 z-40">
        <button
          onClick={() => window.location.href = '/settings'}
          className="bg-gray-800 hover:bg-gray-700 text-white p-4 rounded-full shadow-lg"
        >
          ⚙️
        </button>
      </div>

      {/* Free Tier Notice */}
      {!subscription?.hasActiveSubscription && (
        <div className="absolute top-4 left-4 bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg z-40">
          <p className="text-sm">Free Tier - Limited alerts</p>
        </div>
      )}
    </div>
  );
};

export default MapPage;
