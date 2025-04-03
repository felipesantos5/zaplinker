import { useState, useEffect } from "react";
import { auth } from "../config/firebase-config"; // ajuste o caminho conforme necessário
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import axios from "axios";
import { useToast } from "../hooks/use-toast";
import { User } from "../types/user"; // ajuste o caminho conforme necessário
import { useNavigate, useLocation } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

interface AuthHookResult {
  email: string;
  password: string;
  showPassword: boolean;
  errorLogin: string;
  user: User | null;
  firebaseUser: FirebaseUser | null;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setShowPassword: (showPassword: boolean) => void;
  setErrorLogin: (errorLogin: string) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => void;
  handleSignInWithEmail: () => Promise<void>;
  toggleShowPassword: () => void;
  createOrUpdateUser: (fbUser: FirebaseUser) => Promise<User>;
  isLoading: boolean;
}

export const useAuth = (): AuthHookResult => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorLogin, setErrorLogin] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Estado para controlar o carregamento inicial
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setIsLoading(true); // Define o estado de carregamento como verdadeiro ao iniciar a verificação
      if (fbUser) {
        setFirebaseUser(fbUser);

        try {
          const response = await axios.post<User>(`${API_BASE_URL}/api/user`, {
            firebaseUid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
          });
          setUser(response.data); // Atualiza o estado do usuário com os dados do backend

          // Redireciona para a página original ou para /workspaces
          const redirectPath = location.state?.from?.pathname || "/";
          navigate(redirectPath, { replace: true });
        } catch (error) {
          console.error("Erro ao criar/atualizar usuário:", error);
          // Lidar com o erro aqui, talvez deslogando o usuário ou mostrando uma mensagem
        }
      } else {
        setUser(null);
        setFirebaseUser(null);
      }
      setIsLoading(false); // Define o estado de carregamento como falso após a verificação
    });

    return () => unsubscribe(); // Limpeza do listener ao desmontar o componente
  }, []);

  // email e senha

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSignInWithEmail = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Login realizado com sucesso",
      });
      // Redireciona para a página original ou para /workspaces
      const redirectPath = location.state?.from?.pathname || "/";
      navigate(redirectPath, { replace: true });
    } catch (error: any) {
      setErrorLogin("Erro ao fazer login. Verifique suas credenciais.");
      toast({
        title: "Erro ao realizar o login",
        description: "Erro ao fazer login. Verifique suas credenciais.",
        variant: "destructive",
      });
    }
  };

  const toggleShowPassword = () => {
    setShowPassword((prevState) => !prevState);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({
        title: "Login realizado com sucesso",
      });
      // Redireciona para a página original ou para /workspaces
      const redirectPath = location.state?.from?.pathname || "/";
      navigate(redirectPath, { replace: true });
    } catch (error: any) {
      console.error("Erro ao fazer login:", error);
      toast({
        title: "Erro ao realizar o login",
        description: "Ocorreu um erro ao fazer login com o Google. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

  const signOut = () => {
    auth.signOut();
    setUser(null);
    setFirebaseUser(null);
    toast({
      title: "Logout realizado com sucesso",
    });

    console.log(`login`);
    navigate("/login");
  };

  const createOrUpdateUser = async (fbUser: FirebaseUser): Promise<User> => {
    try {
      const response = await axios.post<User>(`${API_BASE_URL}/api/user`, {
        firebaseUid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName,
      });

      return response.data;
    } catch (error: any) {
      console.error("Erro ao criar/atualizar usuário:", error);
      toast({
        title: "Erro ao criar/atualizar usuário",
        description: "Ocorreu um erro ao criar ou atualizar o usuário. Por favor, tente novamente.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    email,
    password,
    showPassword,
    errorLogin,
    user,
    firebaseUser,
    setEmail,
    setPassword,
    setShowPassword,
    setErrorLogin,
    signInWithGoogle,
    signOut,
    handleSignInWithEmail,
    toggleShowPassword,
    createOrUpdateUser,
    isLoading,
  };
};
