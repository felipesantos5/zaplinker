const WhatsappNumber = require("../models/WhatsappNumber");
const User = require("../models/User");

exports.addNumber = async (req, res) => {
  try {
    const { number, text } = req.body;
    const newNumber = new WhatsappNumber({ userId: req.user._id, number, text });
    await newNumber.save();
    res.status(201).json(newNumber);
  } catch (error) {
    res.status(400).json({ message: "Erro ao adicionar número", error: error.message });
  }
};

exports.getNumbers = async (req, res) => {
  try {
    const numbers = await WhatsappNumber.find({ userId: req.user._id });
    res.json(numbers);
  } catch (error) {
    res.status(400).json({ message: "Erro ao obter números", error: error.message });
  }
};

exports.redirectToWhatsapp = async (req, res) => {
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

    // Certifique-se de que o número e o texto estão formatados corretamente
    const whatsappNumber = randomNumber.number.replace(/\D/g, ""); // Remove tudo que não é dígito
    const whatsappText = encodeURIComponent(randomNumber.text || ""); // Codifica o texto para o formato URL

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappText}`;

    res.redirect(whatsappUrl);
  } catch (error) {
    res.status(500).json({ message: "Erro no servidor", error: error.message });
  }
};

exports.toggleNumberStatus = async (req, res) => {
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
};

exports.deleteNumber = async (req, res) => {
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
};
