export type CameraType = 'FIXED_SPEED' | 'RED_LIGHT' | 'AVERAGE_SPEED';
export type SpeedUnit = 'MPH' | 'KMH';
export type SubscriptionStatus = 'FREE' | 'ACTIVE' | 'CANCELED' | 'PAST_DUE';

export interface SpeedCamera {
  id: string;
  latitude: number;
  longitude: number;
  type: CameraType;
  speedLimit: number | null;
  verifiedAt: string;
}

export interface UserSettings {
  id: string;
  userId: string;
  alertDistance: number;
  alertSound: boolean;
  speedUnit: SpeedUnit;
  disclaimerAccepted: boolean;
}

export interface User {
  id: string;
  email: string;
  isGuest?: boolean;
}

export interface Subscription {
  status: SubscriptionStatus;
  hasActiveSubscription: boolean;
  planType?: 'FREE' | 'PREMIUM';
  currentPeriodEnd?: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}
