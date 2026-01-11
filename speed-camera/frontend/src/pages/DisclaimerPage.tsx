import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const DisclaimerPage: React.FC = () => {
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);

  const handleAccept = async () => {
    if (!accepted) {
      alert('Please accept the terms to continue');
      return;
    }

    try {
      await api.put('/settings', { disclaimerAccepted: true });
      navigate('/map');
    } catch (error) {
      console.error('Failed to save disclaimer acceptance:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-gray-800 rounded-lg p-8 shadow-2xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-red-500">
          ⚠️ Safety & Legal Notice
        </h1>

        <div className="space-y-4 text-gray-300 mb-8">
          <p className="text-lg">
            <strong>Speed Camera</strong> is an informational assistance tool only.
            It does not guarantee the accuracy, completeness, or timeliness of speed camera data.
          </p>

          <p>
            Drivers are <strong>solely responsible</strong> for complying with traffic laws, 
            speed limits, and road conditions at all times.
          </p>

          <p>
            <strong className="text-yellow-500">Do not interact with the app while driving.</strong> 
            {' '}Configure alerts before starting your journey.
          </p>

          <p>
            Speed Camera assumes <strong>no liability</strong> for fines, penalties, accidents, 
            or damages resulting from the use of this app.
          </p>

          <p className="font-semibold text-white">
            By using Speed Camera, you agree to these terms.
          </p>
        </div>

        <div className="flex items-center mb-6">
          <input
            type="checkbox"
            id="accept"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="w-6 h-6 mr-3 cursor-pointer"
          />
          <label htmlFor="accept" className="text-lg cursor-pointer">
            I have read and accept the terms above
          </label>
        </div>

        <button
          onClick={handleAccept}
          disabled={!accepted}
          className={`w-full py-4 rounded-lg text-xl font-bold transition-all ${
            accepted
              ? 'bg-green-600 hover:bg-green-700 cursor-pointer'
              : 'bg-gray-600 cursor-not-allowed opacity-50'
          }`}
        >
          Accept & Continue
        </button>
      </div>
    </div>
  );
};

export default DisclaimerPage;
