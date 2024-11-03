import { User as FirebaseUser } from "firebase/auth";

export interface WhatsappNumber {
  _id: string;
  number: string;
  text?: string;
  isActive: boolean;
}

export interface User {
  _id: string;
  firebaseUid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  customUrl?: string;
}

export type FirebaseUserType = FirebaseUser;
