import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import QRCode from "qrcode";
import useragent from "express-useragent";
import Workspace from "./models/workspace.model.js";
import cookieParser from "cookie-parser";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import "dotenv/config";
import { getCountryFromIP } from "./helper/getCountryFromIP.js";

const app = express();

const prodCorsOptions = {
  origin: ["https://app.zaplinker.com/", "app.zaplinker.com"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Firebase-UID", "sbr"],
  optionsSuccessStatus: 200,
};

app.use(cors());

app.options("*", cors(prodCorsOptions));

// Middlewares
app.use(cookieParser());
app.use(express.json());
app.use(useragent.express());
app.set("trust proxy", true);

app.use((req, res, next) => {
  try {
    const visitorCookie = req.cookies.visitorId || uuidv4();
    const userIp = (req.headers["x-forwarded-for"] || req.ip).split(",")[0].trim();

    // Verifica se o crypto está funcionando
    if (!crypto || !crypto.createHash) {
      throw new Error("Módulo crypto não carregado corretamente");
    }

    // Cria o hash de forma segura
    const hash = crypto.createHash("sha256");
    hash.update(`${visitorCookie}-${userIp}-${req.headers["user-agent"] || ""}`);
    req.visitorId = hash.digest("hex");

    res.cookie("visitorId", visitorCookie, {
      maxAge: 365 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    next();
  } catch (error) {
    console.error("Erro no middleware de visitorId:", error);
    res.status(500).send("Erro interno do servidor");
  }
});

const detectDeviceType = (req, res, next) => {
  const userAgent = req.headers["user-agent"] || "";
  req.isMobile = /Mobile|Android|iP(hone|od|ad)|IEMobile|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  next();
};

app.use(detectDeviceType);

const PLAN_LIMITS = {
  free: {
    maxWorkspaces: 1,
    maxNumbersPerWorkspace: 2,
  },
  pro: {
    maxWorkspaces: 5,
    maxNumbersPerWorkspace: 10,
  },
  premium: {
    maxWorkspaces: Infinity,
    maxNumbersPerWorkspace: Infinity,
  },
};

// Use esse middleware nas rotas que precisam rastrear o tipo de dispositivo

// Modelo de Usuário atualizado
const User = mongoose.model(
  "User",
  new mongoose.Schema({
    firebaseUid: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    displayName: String,
    createdAt: { type: Date, default: Date.now },
    personalHash: { type: Date, default: Date.now },
    role: { type: String, default: "free", enum: ["free", "pro", "premium"] }, // Novo campo para o plano
  })
);

// Novo modelo de Workspace
// const Workspace = mongoose.model(
//   "Workspace",
//   new mongoose.Schema(
//     {
//       name: {
//         type: String,
//         required: true,
//         maxlength: 25,
//       },
//       customUrl: {
//         type: String,
//         required: true,
//         unique: true,
//         maxlength: 35,
//         match: /^[a-zA-Z0-9_-]+$/,
//       },
//       userId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//         required: true,
//       },
//       accessCount: {
//         type: Number,
//         default: 0,
//       },
//       desktopAccessCount: {
//         type: Number,
//         default: 0,
//       },
//       mobileAccessCount: {
//         type: Number,
//         default: 0,
//       },
//       uniqueVisitors: [
//         {
//           ip: String,
//           firstVisit: Date,
//         },
//       ],
//       accessDetails: [
//         {
//           timestamp: Date,
//           deviceType: String,
//           ipAddress: String,
//         },
//       ],
//     },
//     {
//       timestamps: true,
//     }
//   )
// );

// Modelo de Número de WhatsApp atualizado
const WhatsappNumber = mongoose.model(
  "WhatsappNumber",
  new mongoose.Schema({
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    number: { type: String, required: true },
    text: String,
    isActive: { type: Boolean, default: true },
    accessCount: { type: Number, default: 0 },
    accessTimes: [{ type: Date }], // Novo campo para registrar horários
  })
);

const UniqueVisitor = mongoose.model(
  "UniqueVisitor",
  new mongoose.Schema({
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    firstVisit: {
      type: Date,
      default: Date.now,
    },
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
// .then(() => {
//   const resetDatabase = async () => {
//     try {
//       await mongoose.connection.db.collection("users").deleteMany({});
//       await mongoose.connection.db.collection("whatsappnumbers").deleteMany({});
//       await mongoose.connection.db.collection("workspaces").deleteMany({});
//       console.log("Todas as coleções foram resetadas.");
//     } catch (error) {
//       console.error("Erro ao resetar banco de dados:", error);
//     }
//   };
//   resetDatabase();
// });

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
  const { firebaseUid, email, displayName } = req.body;

  try {
    let user = await User.findOne({ firebaseUid });
    if (user) {
      // Atualiza o usuário existente
      user.email = email;
      if (displayName) user.displayName = displayName;
      await user.save();
    } else {
      // Cria um novo usuário
      user = new User({ firebaseUid, email, displayName });
      await user.save();
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Erro ao criar/atualizar usuário:", error); // Log completo
    res.status(400).json({ message: "Erro ao criar/atualizar usuário", error: error.message });
  }
});

// Nova rota para criar um workspace
app.post("/api/workspace", authMiddleware, async (req, res) => {
  const { customUrl, name, utmParameters = {} } = req.body;

  if (!customUrl || !name) {
    return res.status(400).json({ message: "URL personalizada e nome são obrigatórios" });
  }

  const userPlan = req.user.role;
  const userWorkspacesCount = await Workspace.countDocuments({ userId: req.user._id });

  if (userWorkspacesCount >= PLAN_LIMITS[userPlan].maxWorkspaces) {
    return res.status(403).json({ message: "Limite de workspaces atingido para o seu plano" });
  }

  try {
    const existingWorkspace = await Workspace.findOne({ customUrl });
    if (existingWorkspace) {
      return res.status(409).json({ message: "URL já está em uso" });
    }

    const newWorkspace = new Workspace({
      userId: req.user._id,
      customUrl,
      name,
      utmParameters,
    });

    await newWorkspace.save();

    res.status(201).json({ message: "Workspace criado com sucesso", workspace: newWorkspace });
  } catch (error) {
    res.status(500).json({
      message: "Erro ao criar workspace",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Rota para listar workspaces do usuário com informações de estatísticas
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
    const { name, customUrl, utmParameters } = req.body;
    const updates = {};

    // Verificar existência do workspace
    const workspace = await Workspace.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace não encontrado" });
    }

    // Atualizar nome (se fornecido)
    if (name !== undefined) {
      if (name.length > 25) {
        return res.status(400).json({
          message: "Nome excede o limite de 25 caracteres",
        });
      }
      updates.name = name;
    }

    // Atualizar URL customizada (se fornecido)
    if (customUrl !== undefined) {
      const urlRegex = /^[a-zA-Z0-9_-]+$/;

      if (customUrl.length > 35) {
        return res.status(400).json({
          message: "URL excede o limite de 35 caracteres",
        });
      }

      if (!urlRegex.test(customUrl)) {
        return res.status(400).json({ message: "Formato de URL inválido" });
      }

      const existingWorkspace = await Workspace.findOne({
        customUrl,
        _id: { $ne: id },
      });

      if (existingWorkspace) {
        return res.status(409).json({ message: "URL já está em uso" });
      }

      updates.customUrl = customUrl;
    }

    // Atualizar UTM Parameters (merge parcial)
    if (utmParameters !== undefined) {
      const validUtmFields = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];

      const mergedUtm = { ...workspace.utmParameters };

      validUtmFields.forEach((field) => {
        if (utmParameters[field] !== undefined) {
          mergedUtm[field] = utmParameters[field];
        }
      });

      updates.utmParameters = mergedUtm;
    }

    // Aplicar atualizações
    const updatedWorkspace = await Workspace.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

    res.json({
      message: "Workspace atualizado com sucesso",
      workspace: updatedWorkspace,
    });
  } catch (error) {
    // Tratar erros de validação do Mongoose
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    // Tratar erros de duplicidade (caso race condition na URL)
    if (error.code === 11000) {
      return res.status(409).json({ message: "URL já está em uso" });
    }

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

// Rota para puxar informação de estatísticas do workspace por ID
app.get("/api/workspaces/:id/stats", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const workspace = await Workspace.findById(id)
      .select("-__v -userId") // Remove campos internos e sensíveis
      .lean();

    if (!workspace) {
      return res.status(404).json({ message: "Workspace não encontrado" });
    }

    // Buscar números associados se ainda necessário
    const numbers = await WhatsappNumber.find({ workspaceId: id }).select("desktopAccessCount mobileAccessCount").lean();

    // Formatar a resposta incluindo todos os dados relevantes
    const response = {
      ...workspace,
      utmParameters: {
        ...workspace.utmParameters,
        // Garante que campos nulos não sejam enviados como null
        utm_campaign: workspace.utmParameters.utm_campaign || undefined,
        utm_term: workspace.utmParameters.utm_term || undefined,
        utm_content: workspace.utmParameters.utm_content || undefined,
      },
      statistics: {
        totalAccess: workspace.accessCount,
        uniqueVisitors: workspace.uniqueVisitorCount,
        devices: {
          desktop: workspace.desktopAccessCount,
          mobile: workspace.mobileAccessCount,
        },
        linkedNumbers: numbers.length,
        lastUpdated: workspace.updatedAt,
      },
      visitors: workspace.visitors.map((v) => ({
        ...v,
        _id: undefined, // Remove o _id interno dos visitantes
      })),
      accessDetails: workspace.accessDetails.map((ad) => ({
        ...ad,
        _id: undefined, // Remove o _id interno dos detalhes de acesso
      })),
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      message: "Erro no servidor",
      error: error.message,
    });
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

    const workspace = await Workspace.findOne({ _id: workspaceId, userId: req.user._id });
    if (!workspace) {
      return res.status(404).json({ message: "Workspace não encontrado" });
    }

    const userPlan = req.user.role;
    const numbersCount = await WhatsappNumber.countDocuments({ workspaceId });

    if (numbersCount >= PLAN_LIMITS[userPlan].maxNumbersPerWorkspace) {
      return res.status(403).json({ message: "Limite de números atingido para este workspace" });
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

const isSocialBot = (req) => {
  const userAgent = req.headers["user-agent"] || "";
  const bots = [/WhatsApp/i, /Discordbot/i, /TelegramBot/i, /Twitterbot/i, /LinkedInBot/i, /Facebookbot/i, /HeadlessChrome/i];
  return bots.some((bot) => bot.test(userAgent));
};

// Adicione o índice único no modelo UniqueVisitor (coloque ANTES das definições de rota)
Workspace.schema.index({ uniqueVisitors: 1 }, { unique: true, sparse: true });

// Rota para redirecionamento baseada na URL personalizada do workspace
app.get("/:customUrl", async (req, res) => {
  if (isSocialBot(req)) {
    return res.status(200).send("Social Media Preview"); // Não conta o acesso
  }

  try {
    const { customUrl } = req.params;
    const now = new Date();
    const userIp = (req.headers["x-forwarded-for"] || req.ip).split(",")[0].trim();
    const deviceType = req.useragent.isMobile ? "mobile" : "desktop";

    const country = await getCountryFromIP(userIp);

    // 1. Tentar atualizar visitante existente
    const updateResult = await Workspace.findOneAndUpdate(
      {
        customUrl,
        "visitors.visitorId": req.visitorId,
      },
      {
        $inc: {
          accessCount: 1,
          [`${deviceType}AccessCount`]: 1,
          "visitors.$.visitCount": 1,
        },
        $set: {
          "visitors.$.lastVisit": now,
        },
        $push: {
          accessDetails: {
            timestamp: now,
            deviceType,
            ipAddress: userIp,
            visitorId: req.visitorId,
            country,
          },
        },
      },
      { new: true }
    );

    // 2. Se não encontrou o visitante, adicionar novo
    if (!updateResult) {
      await Workspace.findOneAndUpdate(
        { customUrl },
        {
          $inc: {
            accessCount: 1,
            [`${deviceType}AccessCount`]: 1,
          },
          $push: {
            visitors: {
              visitorId: req.visitorId,
              ip: userIp,
              userAgent: req.headers["user-agent"],
              firstVisit: now,
              lastVisit: now,
              visitCount: 1,
            },
            accessDetails: {
              timestamp: now,
              deviceType,
              ipAddress: userIp,
              visitorId: req.visitorId,
              country,
            },
          },
        },
        { new: true }
      );
    }

    // 3. Buscar números ativos e redirecionar
    const workspace = await Workspace.findOne({ customUrl });
    const activeNumbers = await WhatsappNumber.find({
      workspaceId: workspace._id,
      isActive: true,
    });

    const utmParams = [];
    for (const [key, value] of Object.entries(workspace.utmParameters)) {
      if (value) utmParams.push(`${key}=${encodeURIComponent(value)}`);
    }

    if (activeNumbers.length === 0) {
      return res.status(404).json({ message: "Nenhum número ativo encontrado" });
    }

    const randomNumber = activeNumbers[Math.floor(Math.random() * activeNumbers.length)];

    // Construir parâmetros da URL
    const urlParams = new URLSearchParams();

    // Parâmetro obrigatório do WhatsApp
    urlParams.append("phone", randomNumber.number);

    // Adicionar texto se existir
    if (randomNumber.text) {
      urlParams.append("text", randomNumber.text);
    }

    // Adicionar UTM Parameters do Workspace
    if (workspace.utmParameters) {
      Object.entries(workspace.utmParameters).forEach(([key, value]) => {
        if (value) urlParams.append(key, value);
      });
    }

    // Construir URL final
    const whatsappUrl = `https://api.whatsapp.com/send?${urlParams.toString()}`;

    // Atualizar estatísticas
    WhatsappNumber.findByIdAndUpdate(randomNumber._id, {
      $inc: { accessCount: 1 },
      $push: { accessTimes: now },
    }).catch(console.error);

    res.redirect(whatsappUrl);
  } catch (error) {
    console.error("Erro:", error);
    res.status(500).json({
      message: "Erro no servidor",
      error: process.env.NODE_ENV === "development" ? error.message : null,
    });
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

    await number.deleteOne({ _id: number.workspaceId });

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

app.get("/", (req, res) => {
  res.redirect("https://use.zaplinker.com");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
