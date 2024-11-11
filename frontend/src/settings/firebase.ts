// src/firebase.ts

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyALFUMro1Yyr1olR4FOLxYrsJ2hOmJCJnQ",
  authDomain: "zapfy-b8baa.firebaseapp.com",
  projectId: "zapfy-b8baa",
  storageBucket: "zapfy-b8baa.firebasestorage.app",
  messagingSenderId: "1052384737823",
  appId: "1:1052384737823:web:6cae107fc616667eb1332a",
};

// Inicialize o Firebase
const app = initializeApp(firebaseConfig);

// Exporte a instância de autenticação
export const auth = getAuth(app);

// Exporte a instância do app se necessário em outras partes do seu código
export default app;
