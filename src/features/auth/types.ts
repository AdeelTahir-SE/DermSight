/**
 * Auth feature types.
 */

export interface AuthSession {
  userId: string;
  workerName: string;
  email: string;
  isAuthenticated: boolean;
  pinSet: boolean;
}

export interface LoginCredentials {
  emailOrId: string;
  passwordOrPin: string;
}
