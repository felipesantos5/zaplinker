const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  const firebaseUid = req.header("Firebase-UID");
  if (!firebaseUid) return res.status(401).json({ message: "Acesso negado" });

  try {
    let user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(401).json({ message: "Usuário não encontrado" });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ message: "Erro no servidor", error: error.message });
  }
};

module.exports = authMiddleware;
