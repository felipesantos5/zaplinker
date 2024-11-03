import axios from "axios";
import { User, WhatsappNumber, FirebaseUserType } from "../types";
import { auth } from "../config/firebase";

const API_BASE_URL = "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const createOrUpdateUser = async (fbUser: FirebaseUserType): Promise<User> => {
  try {
    const response = await api.post<User>("/api/user", {
      firebaseUid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName,
      photoURL: fbUser.photoURL,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Erro ao criar/atualizar usuário:", error.response?.data || error.message);
    } else {
      console.error("Erro ao criar/atualizar usuário:", error);
    }
    throw error;
  }
};

export const fetchNumbers = async (userId: string): Promise<WhatsappNumber[]> => {
  const response = await api.get<WhatsappNumber[]>("/api/whatsapp", {
    headers: { "Firebase-UID": userId },
  });
  return response.data;
};

export const addNumber = async (userId: string, number: string, text: string) => {
  return api.post("/api/whatsapp", { number, text }, { headers: { "Firebase-UID": userId } });
};

export const toggleNumberStatus = async (userId: string, numberId: string, currentStatus: boolean) => {
  return api.put(`/api/whatsapp/${numberId}/toggle`, { isActive: !currentStatus }, { headers: { "Firebase-UID": userId } });
};

export const deleteNumber = async (userId: string, numberId: string) => {
  return api.delete(`/api/whatsapp/${numberId}`, { headers: { "Firebase-UID": userId } });
};

export const updateCustomUrl = async (userId: string, customUrl: string) => {
  return api.put("/api/user/custom-url", { customUrl }, { headers: { "Firebase-UID": userId } });
};

api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
