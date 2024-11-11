export const API_BASE_URL = "http://localhost:5000";

export interface WhatsappNumber {
  _id: string;
  number: string;
  text?: string;
  isActive: boolean;
}

export interface Workspace {
  _id: string;
  name: string;
  customUrl: string;
}

export interface User {
  _id: string;
  firebaseUid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}
