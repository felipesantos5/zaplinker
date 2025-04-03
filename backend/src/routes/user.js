import express from "express";
const router = express.Router();
import User from "../models/user.js";

router.post("/user", async (req, res) => {
  const { firebaseUid, email, displayName, phone } = req.body;

  try {
    // Validação dos dados recebidos
    if (!firebaseUid || !email) {
      return res.status(400).json({ message: "firebaseUid e email são obrigatórios" });
    }

    // Procura o usuário pelo firebaseUid
    let user = await User.findOne({ firebaseUid });

    if (user) {
      // Usuário já existe, atualiza os dados
      user.email = email;
      if (displayName) user.displayName = displayName;
      if (phone) user.phone = phone; // Adiciona ou atualiza o telefone
      await user.save();
      return res.status(200).json(user);
    } else {
      // Usuário não existe, tenta criar no Firebase Authentication
      try {
        // Cria o usuário no Firebase Authentication
        // const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // const fbUser = userCredential.user;

        // Cria um novo usuário no MongoDB
        const newUser = new User({
          firebaseUid,
          email,
          displayName,
          phone, // Adiciona o telefone
        });
        await newUser.save();
        return res.status(201).json(newUser);
      } catch (firebaseError) {
        // Se falhar na criação do Firebase, retorna o erro
        console.error("Erro ao criar usuário no Firebase:", firebaseError);
        return res.status(400).json({ message: "Erro ao criar usuário no Firebase", error: firebaseError.message });
      }
    }
  } catch (error) {
    console.error("Erro ao criar/atualizar usuário:", error);
    res.status(500).json({ message: "Erro ao criar/atualizar usuário", error: error.message });
  }
});

export default router;
