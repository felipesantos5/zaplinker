import React, { createContext, useState, useEffect, useContext } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { auth } from '../services/firebase';
import { createOrUpdateUser, User } from '../services/api';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const userData = await createOrUpdateUser(fbUser);
          setUser(userData);
        } catch (error) {
          console.error('Erro ao criar/atualizar usuário:', error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ firebaseUser, user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};