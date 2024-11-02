const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/send-email', async (req, res) => {
  const { description, location, currentLocation, imageUrl, email } = req.body;

  const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
      user: 'ecodenunciaong@gmail.com',
      pass: 'Daniel431.', 
    },
  });

  const mailOptions = {
    from: 'ecodenunciaong@gmail.com', // Remetente
    to: email, // Destinatário definido pelo usuário
    subject: 'Nova Denúncia',
    text: `Descrição: ${description}\nLocalização: ${currentLocation}\nImagem: ${imageUrl}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "E-mail enviado com sucesso!" }); 
} catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    res.status(500).json({ message: "Não foi possível enviar o e-mail." }); 
}
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
