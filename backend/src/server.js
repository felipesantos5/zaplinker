const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = "mongodb+srv://zapfy:U7f4hDGJnTmZ6CB6@cluster0.qedku.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Modelo de Usuário atualizado
const User = mongoose.model(
  "User",
  new mongoose.Schema({
    firebaseUid: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    displayName: String,
    photoURL: String,
    customUrl: { type: String, unique: true, sparse: true },
    createdAt: { type: Date, default: Date.now },
  })
);

// Modelo de Número de WhatsApp
const WhatsappNumber = mongoose.model(
  "WhatsappNumber",
  new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    number: { type: String, required: true },
    text: String,
    isActive: { type: Boolean, default: true },
  })
);

const clientOptions = {
  serverApi: { version: "1", strict: true, deprecationErrors: true },
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

mongoose
  .connect(uri, clientOptions)
  .then(() => console.log("Conectado ao MongoDB com sucesso!"))
  .catch((err) => console.error("Erro ao conectar ao MongoDB:", err));

// Middleware de autenticação
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

// Rota para criar ou atualizar usuário após login com Firebase
app.post("/api/user", async (req, res) => {
  const { firebaseUid, email, displayName, photoURL } = req.body;

  try {
    let user = await User.findOne({ firebaseUid });
    if (user) {
      // Atualiza o usuário existente
      user.email = email;
      user.displayName = displayName;
      user.photoURL = photoURL;
      await user.save();
    } else {
      // Cria um novo usuário
      user = new User({ firebaseUid, email, displayName, photoURL });
      await user.save();
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ message: "Erro ao criar/atualizar usuário", error: error.message });
  }
});

// Nova rota para atualizar a URL personalizada
app.put("/api/user/custom-url", authMiddleware, async (req, res) => {
  const { customUrl } = req.body;

  if (!customUrl) {
    return res.status(400).json({ message: "URL personalizada é obrigatória" });
  }

  // Validar o formato da URL personalizada
  const urlRegex = /^[a-zA-Z0-9_-]+$/;
  if (!urlRegex.test(customUrl)) {
    return res.status(400).json({ message: "Formato de URL inválido" });
  }

  try {
    // Verificar se a URL já está em uso
    const existingUser = await User.findOne({ customUrl });
    if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
      return res.status(409).json({ message: "URL já está em uso" });
    }

    // Atualizar a URL personalizada do usuário
    const updatedUser = await User.findByIdAndUpdate(req.user._id, { customUrl }, { new: true });

    res.json({ message: "URL personalizada atualizada com sucesso", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar URL personalizada", error: error.message });
  }
});

// Rota para adicionar um novo número (protegida)
app.post("/api/whatsapp", authMiddleware, async (req, res) => {
  try {
    const { number, text } = req.body;
    const newNumber = new WhatsappNumber({ userId: req.user._id, number, text });
    await newNumber.save();
    res.status(201).json(newNumber);
  } catch (error) {
    res.status(400).json({ message: "Erro ao adicionar número", error: error.message });
  }
});

// Rota para puxar todos os números do usuário (protegida)
app.get("/api/whatsapp", authMiddleware, async (req, res) => {
  try {
    const numbers = await WhatsappNumber.find({ userId: req.user._id });
    res.json(numbers);
  } catch (error) {
    res.status(400).json({ message: "Erro ao obter números", error: error.message });
  }
});

// Rota para redirecionamento baseado na URL personalizada
app.get("/:customUrl", async (req, res) => {
  try {
    const { customUrl } = req.params;
    const user = await User.findOne({ customUrl });

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    const activeNumbers = await WhatsappNumber.find({ userId: user._id, isActive: true });

    if (activeNumbers.length === 0) {
      return res.status(404).json({ message: "Nenhum número ativo encontrado" });
    }

    const randomNumber = activeNumbers[Math.floor(Math.random() * activeNumbers.length)];
    const whatsappUrl = `http://wa.me/${randomNumber.number}?force=true`;

    res.redirect(whatsappUrl);
  } catch (error) {
    res.status(500).json({ message: "Erro no servidor", error: error.message });
  }
});

// Rota para alternar o status de um número
app.put("/api/whatsapp/:numberId/toggle", authMiddleware, async (req, res) => {
  try {
    const { numberId } = req.params;
    const { isActive } = req.body;

    const number = await WhatsappNumber.findOneAndUpdate({ _id: numberId, userId: req.user._id }, { isActive }, { new: true });

    if (!number) {
      return res.status(404).json({ message: "Número não encontrado" });
    }

    res.json(number);
  } catch (error) {
    res.status(400).json({ message: "Erro ao alterar status do número", error: error.message });
  }
});

// Rota para deletar um número
app.delete("/api/whatsapp/:numberId", authMiddleware, async (req, res) => {
  try {
    const { numberId } = req.params;

    const number = await WhatsappNumber.findOneAndDelete({ _id: numberId, userId: req.user._id });

    if (!number) {
      return res.status(404).json({ message: "Número não encontrado" });
    }

    res.json({ message: "Número deletado com sucesso" });
  } catch (error) {
    res.status(400).json({ message: "Erro ao deletar número", error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
