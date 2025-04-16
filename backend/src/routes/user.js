import express from "express";
const router = express.Router();
import User from "../models/user.js";

router.post("/user", async (req, res) => {
  const { firebaseUid, email, displayName, phone } = req.body;

  try {
    // Validação mínima: agora só email é obrigatório
    if (!email) {
      return res.status(400).json({ message: "email é obrigatório" });
    }

    // Procura o usuário por email OU firebaseUid (preferência para firebaseUid se vier)
    let user;
    if (firebaseUid) {
      user = await User.findOne({ firebaseUid });
    } else {
      user = await User.findOne({ email });
    }

    if (user) {
      // Atualiza os campos possíveis (evita sobreescrever firebaseUid se não veio)
      if (firebaseUid && !user.firebaseUid) user.firebaseUid = firebaseUid;
      user.email = email;
      if (displayName) user.displayName = displayName;
      if (phone) user.phone = phone;
      await user.save();
      return res.status(200).json(user);
    } else {
      // Cria um novo usuário com as informações disponíveis
      const newUser = new User({
        firebaseUid,
        email,
        displayName,
        phone,
      });
      await newUser.save();
      return res.status(201).json(newUser);
    }
  } catch (error) {
    console.error("Erro ao criar/atualizar usuário:", error);
    res.status(500).json({ message: "Erro ao criar/atualizar usuário", error: error.message });
  }
});

export default router;
