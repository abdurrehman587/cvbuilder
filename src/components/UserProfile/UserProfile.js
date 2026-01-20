import React, { useState, useEffect } from 'react';
import { supabase, authService } from '../Supabase/supabase';
import { getLocationWithAddress } from '../../utils/geolocation';
import './UserProfile.css';

const UserProfile = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    address: '',
    city: ''
  });
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [userData, setUserData] = useState({
    full_name: '',
    email: ''
  });

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (!user) {
          setLoading(false);
          return;
        }

        setCurrentUser(user);
        setUserData({
          full_name: user.user_metadata?.full_name || '',
          email: user.email || ''
        });

        // Load location from database
        const { data, error } = await supabase
          .from('users')
          .select('latitude, longitude, address, city, full_name')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setLocation({
            latitude: data.latitude || null,
            longitude: data.longitude || null,
            address: data.address || '',
            city: data.city || ''
          });
          if (data.full_name) {
            setUserData(prev => ({ ...prev, full_name: data.full_name }));
          }
        }
      } catch (err) {
        console.error('Error loading user data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleGetCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const locationData = await getLocationWithAddress();
      
      if (locationData.error) {
        alert('Error getting location: ' + locationData.error);
        return;
      }

      // Show accuracy information to user
      let accuracyMessage = '';
      if (locationData.accuracy) {
        if (locationData.accuracy > 100) {
          accuracyMessage = `\n\n⚠️ Location accuracy: ${Math.round(locationData.accuracy)} meters. This may not be very precise.`;
        } else if (locationData.accuracy > 50) {
          accuracyMessage = `\n\n📍 Location accuracy: ${Math.round(locationData.accuracy)} meters.`;
        } else {
          accuracyMessage = `\n\n✅ Location accuracy: ${Math.round(locationData.accuracy)} meters (very accurate).`;
        }
      }

      const confirmed = window.confirm(
        `Location found!\n\nCoordinates: ${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)}${accuracyMessage}\n\nAddress: ${locationData.address || 'Not available'}\nCity: ${locationData.city || 'Not available'}\n\nIs this location correct? Click OK to use it, or Cancel to try again.`
      );

      if (confirmed) {
        setLocation({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          address: locationData.address || '',
          city: locationData.city || ''
        });
      }
    } catch (err) {
      console.error('Error getting location:', err);
      alert('Error getting location: ' + err.message);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleUpdateLocation = async () => {
    if (!currentUser) return;

    try {
      setIsUpdatingLocation(true);
      const { error } = await supabase
        .from('users')
        .update({
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
          city: location.city,
          location_updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);

      if (error) throw error;
      alert('Location updated successfully!');
    } catch (err) {
      console.error('Error updating location:', err);
      alert('Error updating location: ' + err.message);
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  if (loading) {
    return <div className="user-profile-loading">Loading profile...</div>;
  }

  if (!currentUser) {
    return <div className="user-profile-error">Please log in to view your profile.</div>;
  }

  return (
    <div className="user-profile">
      <div className="user-profile-header">
        <h1>My Profile</h1>
      </div>

      <div className="user-profile-section">
        <h2>Account Information</h2>
        <div className="profile-info">
          <div className="info-item">
            <label>Name:</label>
            <span>{userData.full_name || 'Not set'}</span>
          </div>
          <div className="info-item">
            <label>Email:</label>
            <span>{userData.email}</span>
          </div>
        </div>
      </div>

      <div className="user-profile-section">
        <h2>Location</h2>
        <p className="section-description">
          Set your location to help us provide better services. You can use your current location or enter it manually.
        </p>
        
        <div className="location-actions">
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isGettingLocation}
            className="btn btn-primary"
          >
            {isGettingLocation ? 'Getting Location...' : '📍 Use Current Location'}
          </button>
        </div>

        <div className="location-form">
          <div className="form-row">
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              value={location.latitude || ''}
              onChange={(e) => setLocation({ ...location, latitude: e.target.value ? parseFloat(e.target.value) : null })}
              className="form-input"
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              value={location.longitude || ''}
              onChange={(e) => setLocation({ ...location, longitude: e.target.value ? parseFloat(e.target.value) : null })}
              className="form-input"
            />
          </div>
          <input
            type="text"
            placeholder="Address (will be auto-filled if using current location)"
            value={location.address}
            onChange={(e) => setLocation({ ...location, address: e.target.value })}
            className="form-input"
          />
          <input
            type="text"
            placeholder="City (will be auto-filled if using current location)"
            value={location.city}
            onChange={(e) => setLocation({ ...location, city: e.target.value })}
            className="form-input"
          />
          <button
            type="button"
            onClick={handleUpdateLocation}
            disabled={isUpdatingLocation || (!location.latitude || !location.longitude)}
            className="btn btn-success"
          >
            {isUpdatingLocation ? 'Updating...' : 'Update Location'}
          </button>
        </div>

        {location.latitude && location.longitude && (
          <div className="location-display">
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Coordinates:</strong> {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              <a 
                href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  marginLeft: '0.5rem', 
                  color: '#2563eb', 
                  textDecoration: 'underline',
                  fontSize: '0.8rem'
                }}
              >
                📍 View on Map
              </a>
            </div>
            {location.city && <div style={{ marginTop: '0.25rem' }}><strong>City:</strong> {location.city}</div>}
            {location.address && <div className="address-display" style={{ marginTop: '0.25rem' }}><strong>Address:</strong> {location.address}</div>}
            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
              💡 Tip: Click "View on Map" to verify the location is correct. You can manually adjust the coordinates if needed.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
