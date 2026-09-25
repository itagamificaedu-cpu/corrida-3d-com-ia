// Servidor bem simples: só entrega os arquivos da pasta public/
const express = require('express');
const caminho = require('path');

const app = express();
const PORTA = process.env.PORTA || 4200;

app.use(express.static(caminho.join(__dirname, 'public')));

app.listen(PORTA, () => {
  console.log(`Corrida 3D com IA rodando em http://localhost:${PORTA}`);
});
