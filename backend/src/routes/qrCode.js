import express from "express";
import QRCode from "qrcode";
import Workspace from "../models/workspace.model.js";
import "dotenv/config";

const router = express.Router();

// Rota para gerar QR Code para a URL personalizada do workspace
router.get("/workspace/:id/qrcode", async (req, res) => {
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

export default router;
