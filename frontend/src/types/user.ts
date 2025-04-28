import { User as FirebaseUser } from "firebase/auth";

export interface User {
  _id: string;
  firebaseUid: string;
  email: string;
  displayName?: string;
  role?: string;
}

export type FirebaseUserType = FirebaseUser;
