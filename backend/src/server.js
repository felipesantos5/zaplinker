const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const QRCode = require("qrcode");
const { kMaxLength } = require("buffer");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Modelo de Usuário atualizado
const User = mongoose.model(
  "User",
  new mongoose.Schema({
    firebaseUid: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    displayName: String,
    photoURL: String,
    createdAt: { type: Date, default: Date.now },
    personalHash: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
    },
  })
);

// Novo modelo de Workspace
const Workspace = mongoose.model(
  "Workspace",
  new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    customUrl: { type: String, unique: true, required: true },
    name: { type: String, required: true, maxlength: [50, "A URL personalizada deve ter no máximo 50 caracteres."] },
    accessCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  })
);

// Modelo de Número de WhatsApp atualizado
const WhatsappNumber = mongoose.model(
  "WhatsappNumber",
  new mongoose.Schema({
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    number: { type: String, required: true },
    text: String,
    isActive: { type: Boolean, default: true },
    accessCount: { type: Number, default: 0 },
  })
);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Conexão com MongoDB estabelecida com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao conectar com o MongoDB:", error.message);
    process.exit(1);
  }
};

connectDB();

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

// Nova rota para criar um workspace
app.post("/api/workspace", authMiddleware, async (req, res) => {
  const { customUrl, name } = req.body;

  if (!customUrl || !name) {
    return res.status(400).json({ message: "URL personalizada e nome são obrigatórios" });
  }

  if (name.length > 25) {
    return res.status(400).json({ message: "Nome do workspace invalido, maximo de 25 caracteres" });
  }
  if (customUrl.length > 35) {
    return res.status(400).json({ message: "URL personalizada invalido, maximo de 30 caracteres" });
  }

  // Validar o formato da URL personalizada
  const urlRegex = /^[a-zA-Z0-9_-]+$/;
  if (!urlRegex.test(customUrl)) {
    return res.status(400).json({ message: "Formato de URL inválido" });
  }

  try {
    // Verificar se a URL já está em uso
    const existingWorkspace = await Workspace.findOne({ customUrl });
    if (existingWorkspace) {
      return res.status(409).json({ message: "URL já está em uso" });
    }

    // Criar novo workspace
    const newWorkspace = new Workspace({
      userId: req.user._id,
      customUrl,
      name,
    });
    await newWorkspace.save();

    res.status(201).json({ message: "Workspace criado com sucesso", workspace: newWorkspace });
  } catch (error) {
    res.status(500).json({ message: "Erro ao criar workspace", error: error.message });
  }
});

// Rota para listar workspaces do usuário
app.get("/api/workspaces", authMiddleware, async (req, res) => {
  try {
    const workspaces = await Workspace.find({ userId: req.user._id });
    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ message: "Erro ao obter workspaces", error: error.message });
  }
});

// Rota para atualizar um workspace
app.put("/api/workspace/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, customUrl } = req.body;

    // Validar campos obrigatórios
    if (!name || !customUrl) {
      return res.status(400).json({ message: "Nome e URL personalizada são obrigatórios" });
    }

    if (name.length > 25) {
      return res.status(400).json({ message: "Nome do workspace invalido, maximo de 25 caracteres" });
    }
    if (customUrl.length > 35) {
      return res.status(400).json({ message: "URL personalizada invalido, maximo de 30 caracteres" });
    }

    // Validar o formato da URL personalizada
    const urlRegex = /^[a-zA-Z0-9_-]+$/;
    if (!urlRegex.test(customUrl)) {
      return res.status(400).json({ message: "Formato de URL inválido" });
    }

    // Verificar se o workspace pertence ao usuário
    const workspace = await Workspace.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace não encontrado" });
    }

    // Verificar se a nova URL personalizada já está em uso por outro workspace
    const existingWorkspace = await Workspace.findOne({
      customUrl: customUrl,
      _id: { $ne: id },
    });

    if (existingWorkspace) {
      return res.status(409).json({ message: "URL personalizada já está em uso" });
    }

    // Atualizar o workspace
    workspace.name = name;
    workspace.customUrl = customUrl;
    await workspace.save();

    res.json({
      message: "Workspace atualizado com sucesso",
      workspace,
    });
  } catch (error) {
    res.status(500).json({
      message: "Erro ao atualizar workspace",
      error: error.message,
    });
  }
});

// Rota para deletar um workspace
app.delete("/api/workspace/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o workspace pertence ao usuário
    const workspace = await Workspace.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace não encontrado" });
    }

    // Deletar todos os números de WhatsApp associados ao workspace
    await WhatsappNumber.deleteMany({ workspaceId: id });

    // Deletar o workspace
    await Workspace.deleteOne({ _id: id });

    res.json({
      message: "Workspace deletado com sucesso",
    });
  } catch (error) {
    res.status(500).json({
      message: "Erro ao deletar workspace",
      error: error.message,
    });
  }
});

// rota para puxar informação do workspace
app.get("/api/workspaces/:id/stats", async (req, res) => {
  try {
    const { id } = req.params;
    const workspace = await Workspace.findById(id);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace não encontrado" });
    }

    res.json({ accessCount: workspace.accessCount });
  } catch (error) {
    res.status(500).json({ message: "Erro no servidor", error: error.message });
  }
});

// Endpoint para recuperar acessos por número
app.get("/api/workspaces/:id/numbers/stats", async (req, res) => {
  try {
    const { id } = req.params;
    const numbers = await WhatsappNumber.find({ workspaceId: id });

    const stats = numbers.map((number) => ({
      number: number.number,
      accessCount: number.accessCount,
    }));

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Erro no servidor", error: error.message });
  }
});

// Rota para adicionar um novo número (atualizada para usar workspaceId)
app.post("/api/whatsapp", authMiddleware, async (req, res) => {
  try {
    const { workspaceId, number, text } = req.body;

    // Verificar se o workspace pertence ao usuário
    const workspace = await Workspace.findOne({ _id: workspaceId, userId: req.user._id });
    if (!workspace) {
      return res.status(404).json({ message: "Workspace não encontrado" });
    }

    const newNumber = new WhatsappNumber({ workspaceId, number, text });
    await newNumber.save();
    res.status(201).json(newNumber);
  } catch (error) {
    res.status(400).json({ message: "Erro ao adicionar número", error: error.message });
  }
});

// Rota para puxar todos os números de um workspace específico
app.get("/api/whatsapp/:workspaceId", authMiddleware, async (req, res) => {
  try {
    const { workspaceId } = req.params;

    // Verificar se o workspace pertence ao usuário
    const workspace = await Workspace.findOne({ _id: workspaceId, userId: req.user._id });
    if (!workspace) {
      console.log("error");
      return res.status(404).json({ message: "Workspace não encontrado" });
    }

    const numbers = await WhatsappNumber.find({ workspaceId });
    res.json(numbers);
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Erro ao obter números", error: error.message });
  }
});

// Rota para redirecionamento baseada na URL personalizada do workspace
app.get("/:customUrl", async (req, res) => {
  try {
    const { customUrl } = req.params;
    const workspace = await Workspace.findOne({ customUrl });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace não encontrado" });
    }

    const activeNumbers = await WhatsappNumber.find({
      workspaceId: workspace._id,
      isActive: true,
    });

    if (activeNumbers.length === 0) {
      return res.status(404).json({ message: "Nenhum número ativo encontrado" });
    }

    const randomNumber = activeNumbers[Math.floor(Math.random() * activeNumbers.length)];

    // Incrementa a contagem de acessos para este número
    await WhatsappNumber.findByIdAndUpdate(randomNumber._id, {
      $inc: { accessCount: 1 },
    });

    const text = randomNumber.text ? encodeURIComponent(randomNumber.text) : "";

    const whatsappUrl = text ? `http://wa.me/${randomNumber.number}?text=${text}&force=true` : `http://wa.me/${randomNumber.number}?force=true`;

    res.redirect(whatsappUrl);
  } catch (error) {
    res.status(500).json({ message: "Erro no servidor", error: error.message });
  }
});

// Rota para alternar o status de um número (atualizada para verificar o workspace)
app.put("/api/whatsapp/:numberId/toggle", authMiddleware, async (req, res) => {
  try {
    const { numberId } = req.params;
    const { isActive } = req.body;

    const number = await WhatsappNumber.findById(numberId);
    if (!number) {
      return res.status(404).json({ message: "Número não encontrado" });
    }

    // Verificar se o workspace do número pertence ao usuário
    const workspace = await Workspace.findOne({ _id: number.workspaceId, userId: req.user._id });
    if (!workspace) {
      return res.status(403).json({ message: "Acesso negado" });
    }

    number.isActive = isActive;
    await number.save();

    res.json(number);
  } catch (error) {
    res.status(400).json({ message: "Erro ao alterar status do número", error: error.message });
  }
});

// Rota para deletar um número (atualizada para verificar o workspace)
app.delete("/api/whatsapp/:numberId", authMiddleware, async (req, res) => {
  try {
    const { numberId } = req.params;

    const number = await WhatsappNumber.findById(numberId);
    if (!number) {
      return res.status(404).json({ message: "Número não encontrado" });
    }

    // Verificar se o workspace do número pertence ao usuário
    const workspace = await Workspace.findOne({ _id: number.workspaceId, userId: req.user._id });
    if (!workspace) {
      return res.status(403).json({ message: "Acesso negado" });
    }

    await number.remove();

    res.json({ message: "Número deletado com sucesso" });
  } catch (error) {
    res.status(400).json({ message: "Erro ao deletar número", error: error.message });
  }
});

// QR CODE

// Rota para gerar QR Code para a URL personalizada do workspace
app.get("/api/workspace/:id/qrcode", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const workspace = await Workspace.findById(id);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace não encontrado" });
    }

    // Construir a URL completa do workspace
    const url = `${process.env.BASE_URL}/${workspace.customUrl}`;

    // Gerar QR Code
    QRCode.toDataURL(url, (err, qrCodeDataUrl) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao gerar QR Code", error: err.message });
      }
      // Retornar o QR code como uma string base64 que pode ser renderizada como imagem
      res.json({ qrCodeDataUrl });
    });
  } catch (error) {
    res.status(500).json({ message: "Erro no servidor", error: error.message });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
