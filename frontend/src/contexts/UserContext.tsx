import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import axios from 'axios';
import { auth } from '../settings/firebase';
import { User, API_BASE_URL } from '../utils/types/types';
import { useToast } from '../hooks/use-toast';

interface UserContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => void;
  createOrUpdateUser: (fbUser: FirebaseUser) => Promise<User>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedUser = localStorage.getItem('firebaseUser');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser) as FirebaseUser;
      setFirebaseUser(parsedUser);
      createOrUpdateUser(parsedUser).then(setUser);
    }

    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        localStorage.setItem('firebaseUser', JSON.stringify(fbUser));
        try {
          const userData = await createOrUpdateUser(fbUser);
          setUser(userData);
        } catch (error) {
          console.error('Error creating/updating user:', error);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
        localStorage.removeItem('firebaseUser');
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      localStorage.setItem('firebaseUser', JSON.stringify(result.user));
      toast({
        title: "Login realizado com sucesso",
        description: new Date().toLocaleString(),
      });
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      toast({
        title: "Erro ao fazer login",
        description: "Ocorreu um erro ao tentar fazer login.",
        variant: "destructive",
      });
    }
  };

  const signOut = () => {
    auth.signOut().then(() => {
      localStorage.removeItem('firebaseUser');
      setFirebaseUser(null);
      setUser(null);
      toast({
        title: "Logout realizado com sucesso",
        description: new Date().toLocaleString(),
      });
    }).catch((error) => {
      console.error('Erro ao fazer logout:', error);
      toast({
        title: "Erro ao fazer logout",
        description: "Ocorreu um erro ao tentar fazer logout.",
        variant: "destructive",
      });
    });
  };

  const createOrUpdateUser = async (fbUser: FirebaseUser): Promise<User> => {
    try {
      const response = await axios.post<User>(`${API_BASE_URL}/api/user`, {
        firebaseUid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName,
        photoURL: fbUser.photoURL
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao criar/atualizar usuário:', error);
      throw error;
    }
  };

  return (
    <UserContext.Provider value={{ user, firebaseUser, signInWithGoogle, signOut, createOrUpdateUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};