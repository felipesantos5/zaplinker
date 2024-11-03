const User = require("../models/User");
const crypto = require("crypto");

exports.createOrUpdateUser = async (req, res) => {
  const { firebaseUid, email, displayName, photoURL } = req.body;

  try {
    let user = await User.findOne({ firebaseUid });
    if (user) {
      user.email = email;
      user.displayName = displayName;
      user.photoURL = photoURL;
    } else {
      // Gerar um personalHash único
      const personalHash = crypto.randomBytes(16).toString("hex");
      user = new User({ firebaseUid, email, displayName, photoURL, personalHash });
    }
    await user.save();
    res.status(200).json(user);
  } catch (error) {
    console.error("Erro ao criar/atualizar usuário:", error);
    res.status(400).json({ message: "Erro ao criar/atualizar usuário", error: error.message });
  }
};

exports.updateCustomUrl = async (req, res) => {
  const { customUrl } = req.body;

  if (!customUrl) {
    return res.status(400).json({ message: "URL personalizada é obrigatória" });
  }

  const urlRegex = /^[a-zA-Z0-9_-]+$/;
  if (!urlRegex.test(customUrl)) {
    return res.status(400).json({ message: "Formato de URL inválido" });
  }

  try {
    const existingUser = await User.findOne({ customUrl });
    if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
      return res.status(409).json({ message: "URL já está em uso" });
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, { customUrl }, { new: true });

    res.json({ message: "URL personalizada atualizada com sucesso", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar URL personalizada", error: error.message });
  }
};
