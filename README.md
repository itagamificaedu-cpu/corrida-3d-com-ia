# Corrida 3D com IA

Jogo de corrida 3D que roda direto no navegador — sem instalar nada, sem Unity,
sem etapa de build. Feito com JavaScript puro + [Three.js](https://threejs.org/)
(a biblioteca já vem incluída no projeto, em `public/vendor/`).

Complete 3 voltas na pista o mais rápido possível e pegue os anéis amarelos
para ganhar turbo.

## Como jogar

- **Computador:** setas do teclado (ou WASD) para acelerar, frear e virar.
- **Celular:** botões na tela (aparecem automaticamente em telas de toque).

## Rodar localmente

```bash
npm install
npm start          # http://localhost:4200
```

## Estrutura

- `server.js` — servidor simples (Express) que só entrega os arquivos de `public/`
- `public/index.html` — telas do jogo (início, HUD, fim, controles de toque)
- `public/estilo.css` — visual das telas e do HUD
- `public/app.js` — motor do jogo: pista, física do carro, câmera, voltas e turbo
- `public/vendor/three.min.js` — biblioteca 3D (Three.js), local para não depender de internet

## Ajustando o jogo

Os principais números do jogo ficam no topo de `public/app.js`:

- `TOTAL_VOLTAS` — quantas voltas para vencer a corrida
- `PISTA_A_FORA` / `PISTA_B_FORA` / `PISTA_A_DENTRO` / `PISTA_B_DENTRO` — tamanho e formato da pista
- Dentro de `estadoCarro`: `velocidadeMax`, `aceleracao`, `frenagem` — como o carro se comporta
