const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");
const userRoutes = require("./routes/user");
const whatsappRoutes = require("./routes/whatsapp");
const whatsappController = require("./controllers/whatsappController");

const app = express();
const PORT = process.env.PORT || 5000;

// Conectar ao banco de dados
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Rotas
app.use("/api/user", userRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.get("/:customUrl", whatsappController.redirectToWhatsapp);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
