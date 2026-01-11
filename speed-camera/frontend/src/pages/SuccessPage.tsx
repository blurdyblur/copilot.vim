import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SuccessPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to settings after 3 seconds
    const timer = setTimeout(() => {
      navigate('/settings');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg p-8 shadow-2xl text-center">
        <div className="text-6xl mb-6">✅</div>
        <h1 className="text-3xl font-bold mb-4">Subscription Successful!</h1>
        <p className="text-gray-300 mb-6">
          Thank you for upgrading to Premium. You now have access to all premium features!
        </p>
        <p className="text-sm text-gray-500">
          Redirecting to settings...
        </p>
      </div>
    </div>
  );
};

export default SuccessPage;
