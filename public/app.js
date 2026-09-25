// Corrida 3D com IA — motor do jogo (Three.js, sem etapa de build)

// ---------- Configuração da pista ----------
const PISTA_A_FORA = 42; // raio externo (eixo X)
const PISTA_B_FORA = 26; // raio externo (eixo Z)
const PISTA_A_DENTRO = 28; // raio interno (eixo X)
const PISTA_B_DENTRO = 14; // raio interno (eixo Z)
const TOTAL_VOLTAS = 3;

// ---------- Cena, câmera, renderizador ----------
const canvas = document.getElementById('canvas-jogo');
const cena = new THREE.Scene();
cena.background = new THREE.Color(0x8ecae6);
cena.fog = new THREE.Fog(0x8ecae6, 60, 160);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 500);

const renderizador = new THREE.WebGLRenderer({ canvas, antialias: true });
renderizador.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderizador.setSize(window.innerWidth, window.innerHeight);
renderizador.shadowMap.enabled = true;

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderizador.setSize(window.innerWidth, window.innerHeight);
});

// ---------- Luzes ----------
cena.add(new THREE.AmbientLight(0xffffff, 0.6));
const luzSol = new THREE.DirectionalLight(0xffffff, 0.9);
luzSol.position.set(40, 60, 20);
luzSol.castShadow = true;
luzSol.shadow.mapSize.set(2048, 2048);
luzSol.shadow.camera.left = -70;
luzSol.shadow.camera.right = 70;
luzSol.shadow.camera.top = 70;
luzSol.shadow.camera.bottom = -70;
cena.add(luzSol);

// ---------- Chão (grama) ----------
const chao = new THREE.Mesh(
  new THREE.PlaneGeometry(400, 400),
  new THREE.MeshStandardMaterial({ color: 0x4caf50 })
);
chao.rotation.x = -Math.PI / 2;
chao.receiveShadow = true;
cena.add(chao);

// ---------- Pista (anel elíptico) ----------
function criarFormaElipse(a, b, sentidoInverso) {
  const forma = new THREE.Shape();
  forma.absellipse(0, 0, a, b, 0, Math.PI * 2, sentidoInverso, 0);
  return forma;
}

const formaPista = criarFormaElipse(PISTA_A_FORA, PISTA_B_FORA, false);
formaPista.holes.push(criarFormaElipse(PISTA_A_DENTRO, PISTA_B_DENTRO, true));

const pista = new THREE.Mesh(
  new THREE.ShapeGeometry(formaPista, 128),
  new THREE.MeshStandardMaterial({ color: 0x3a3a3a })
);
pista.rotation.x = -Math.PI / 2;
pista.position.y = 0.01;
pista.receiveShadow = true;
cena.add(pista);

// grama interna (ilha central)
const ilha = new THREE.Mesh(
  new THREE.ShapeGeometry(criarFormaElipse(PISTA_A_DENTRO, PISTA_B_DENTRO, false), 96),
  new THREE.MeshStandardMaterial({ color: 0x2e7d32 })
);
ilha.rotation.x = -Math.PI / 2;
ilha.position.y = 0.02;
cena.add(ilha);

// linha de largada/chegada
const linhaChegada = new THREE.Mesh(
  new THREE.PlaneGeometry(PISTA_A_FORA - PISTA_A_DENTRO, 2),
  new THREE.MeshBasicMaterial({ color: 0xffffff })
);
linhaChegada.rotation.x = -Math.PI / 2;
linhaChegada.position.set((PISTA_A_FORA + PISTA_A_DENTRO) / 2, 0.03, 0);
cena.add(linhaChegada);

// árvores decorativas ao redor da pista
function criarArvore(x, z) {
  const arvore = new THREE.Group();
  const tronco = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.4, 2, 6),
    new THREE.MeshStandardMaterial({ color: 0x6d4c30 })
  );
  tronco.position.y = 1;
  const copa = new THREE.Mesh(
    new THREE.ConeGeometry(1.6, 3, 8),
    new THREE.MeshStandardMaterial({ color: 0x2e7d32 })
  );
  copa.position.y = 3;
  arvore.add(tronco, copa);
  arvore.position.set(x, 0, z);
  arvore.castShadow = true;
  cena.add(arvore);
}
for (let i = 0; i < 26; i++) {
  const angulo = (i / 26) * Math.PI * 2;
  const raio = PISTA_A_FORA + 8 + Math.random() * 10;
  const raioZ = PISTA_B_FORA + 6 + Math.random() * 8;
  criarArvore(Math.cos(angulo) * raio, Math.sin(angulo) * raioZ);
}

// ---------- Anéis de turbo ----------
const ANGULOS_TURBO = [0.5, 1.6, 2.7, 3.8, 4.9, 5.9];
const aneisTurbo = ANGULOS_TURBO.map((angulo) => {
  const raioMedioA = (PISTA_A_FORA + PISTA_A_DENTRO) / 2;
  const raioMedioB = (PISTA_B_FORA + PISTA_B_DENTRO) / 2;
  const anel = new THREE.Mesh(
    new THREE.TorusGeometry(1.4, 0.25, 12, 24),
    new THREE.MeshStandardMaterial({ color: 0xffd60a, emissive: 0xffaa00, emissiveIntensity: 0.6 })
  );
  anel.position.set(Math.cos(angulo) * raioMedioA, 0.9, Math.sin(angulo) * raioMedioB);
  anel.rotation.x = Math.PI / 2;
  cena.add(anel);
  return { malha: anel, ativo: true, x: anel.position.x, z: anel.position.z };
});

// ---------- Carro ----------
function criarCarro(cor) {
  const carro = new THREE.Group();

  const corpo = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.6, 3.2),
    new THREE.MeshStandardMaterial({ color: cor })
  );
  corpo.position.y = 0.55;
  corpo.castShadow = true;

  const cabine = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.5, 1.4),
    new THREE.MeshStandardMaterial({ color: 0x222831 })
  );
  cabine.position.set(0, 0.95, -0.2);
  cabine.castShadow = true;

  carro.add(corpo, cabine);

  const posicoesRodas = [
    [-0.85, 0.35, 1.1],
    [0.85, 0.35, 1.1],
    [-0.85, 0.35, -1.1],
    [0.85, 0.35, -1.1],
  ];
  posicoesRodas.forEach(([x, y, z]) => {
    const roda = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 0.3, 12),
      new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    roda.rotation.z = Math.PI / 2;
    roda.position.set(x, y, z);
    roda.castShadow = true;
    carro.add(roda);
  });

  return carro;
}

const carro = criarCarro(0xef476f);
carro.position.set((PISTA_A_FORA + PISTA_A_DENTRO) / 2, 0, 0);
carro.rotation.y = 0; // no ponto de partida (ângulo 0), a pista segue na direção +Z
cena.add(carro);

// ---------- Estado da física ----------
const estadoCarro = {
  velocidade: 0,
  velocidadeMax: 44,
  aceleracao: 38,
  frenagem: 34,
  atrito: 14,
  velocidadeGiro: 2.6,
  turboAte: 0, // timestamp (ms) até quando o turbo está ativo
  bateuAntes: false,
};

const entrada = { frente: false, tras: false, esquerda: false, direita: false };

// ---------- Controles de teclado ----------
window.addEventListener('keydown', (evento) => aplicarTecla(evento.code, true));
window.addEventListener('keyup', (evento) => aplicarTecla(evento.code, false));

function aplicarTecla(codigo, pressionado) {
  switch (codigo) {
    case 'ArrowUp':
    case 'KeyW':
      entrada.frente = pressionado;
      break;
    case 'ArrowDown':
    case 'KeyS':
      entrada.tras = pressionado;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      entrada.esquerda = pressionado;
      break;
    case 'ArrowRight':
    case 'KeyD':
      entrada.direita = pressionado;
      break;
  }
}

// ---------- Controles de toque (celular) ----------
function ligarBotaoToque(id, aoPressionar, aoSoltar) {
  const botao = document.getElementById(id);
  const inicia = (e) => { e.preventDefault(); aoPressionar(); };
  const termina = (e) => { e.preventDefault(); aoSoltar(); };
  botao.addEventListener('touchstart', inicia, { passive: false });
  botao.addEventListener('touchend', termina, { passive: false });
  botao.addEventListener('touchcancel', termina, { passive: false });
  botao.addEventListener('mousedown', inicia);
  botao.addEventListener('mouseup', termina);
  botao.addEventListener('mouseleave', termina);
}

ligarBotaoToque('botao-acelerar', () => (entrada.frente = true), () => (entrada.frente = false));
ligarBotaoToque('botao-freio', () => (entrada.tras = true), () => (entrada.tras = false));
ligarBotaoToque('botao-esquerda', () => (entrada.esquerda = true), () => (entrada.esquerda = false));
ligarBotaoToque('botao-direita', () => (entrada.direita = true), () => (entrada.direita = false));

if ('ontouchstart' in window) {
  document.getElementById('controles-toque').classList.remove('escondido');
}

// ---------- Paredes invisíveis (mantêm o carro dentro da pista) ----------
const MARGEM_PAREDE = 1; // dá uma folguinha pro carro não travar bem na borda visual
const MURO_A_FORA = PISTA_A_FORA - MARGEM_PAREDE;
const MURO_B_FORA = PISTA_B_FORA - MARGEM_PAREDE;
const MURO_A_DENTRO = PISTA_A_DENTRO + MARGEM_PAREDE;
const MURO_B_DENTRO = PISTA_B_DENTRO + MARGEM_PAREDE;

function conterNaPista(x, z) {
  const foraNorm = (x / MURO_A_FORA) ** 2 + (z / MURO_B_FORA) ** 2;
  if (foraNorm > 1) {
    const k = 1 / Math.sqrt(foraNorm);
    return { x: x * k, z: z * k, bateu: true };
  }
  const dentroNorm = (x / MURO_A_DENTRO) ** 2 + (z / MURO_B_DENTRO) ** 2;
  if (dentroNorm < 1) {
    const k = 1 / Math.sqrt(dentroNorm);
    return { x: x * k, z: z * k, bateu: true };
  }
  return { x, z, bateu: false };
}

// ---------- Contagem de voltas ----------
let anguloAnterior = Math.atan2(carro.position.z, carro.position.x);
let passouMetade = false;
let voltaAtual = 1;
let corridaComecou = false;
let corridaTerminou = false;
let tempoInicio = 0;
let tempoFinal = 0;

function atualizarVoltas() {
  const angulo = Math.atan2(carro.position.z, carro.position.x);

  if (!passouMetade && Math.abs(angulo) > Math.PI * 0.9) {
    passouMetade = true;
  }
  if (passouMetade && anguloAnterior < 0 && angulo >= 0) {
    passouMetade = false;
    if (voltaAtual >= TOTAL_VOLTAS) {
      finalizarCorrida();
    } else {
      voltaAtual++;
      document.getElementById('hud-voltas').textContent = `Volta ${voltaAtual}/${TOTAL_VOLTAS}`;
    }
  }
  anguloAnterior = angulo;
}

// ---------- Câmera ----------
function atualizarCamera() {
  const distancia = 7;
  const altura = 3.2;
  const alvo = new THREE.Vector3(
    carro.position.x - Math.sin(carro.rotation.y) * distancia,
    carro.position.y + altura,
    carro.position.z - Math.cos(carro.rotation.y) * distancia
  );
  camera.position.lerp(alvo, 0.08);
  camera.lookAt(carro.position.x, carro.position.y + 1, carro.position.z);
}

// ---------- Loop principal ----------
const relogio = new THREE.Clock();

function passoFisica(dt) {
  const emTurbo = performance.now() < estadoCarro.turboAte;
  const velMax = emTurbo ? estadoCarro.velocidadeMax * 1.6 : estadoCarro.velocidadeMax;

  if (entrada.frente) {
    estadoCarro.velocidade += estadoCarro.aceleracao * dt;
  } else if (entrada.tras) {
    estadoCarro.velocidade -= estadoCarro.frenagem * dt;
  } else {
    const sinal = Math.sign(estadoCarro.velocidade);
    estadoCarro.velocidade -= sinal * estadoCarro.atrito * dt;
    if (Math.sign(estadoCarro.velocidade) !== sinal) estadoCarro.velocidade = 0;
  }

  estadoCarro.velocidade = Math.max(-velMax * 0.5, Math.min(velMax, estadoCarro.velocidade));

  const direcaoGiro = estadoCarro.velocidade >= 0 ? 1 : -1;
  if (Math.abs(estadoCarro.velocidade) > 0.3) {
    if (entrada.esquerda) carro.rotation.y += estadoCarro.velocidadeGiro * dt * direcaoGiro;
    if (entrada.direita) carro.rotation.y -= estadoCarro.velocidadeGiro * dt * direcaoGiro;
  }

  const novoX = carro.position.x + Math.sin(carro.rotation.y) * estadoCarro.velocidade * dt;
  const novoZ = carro.position.z + Math.cos(carro.rotation.y) * estadoCarro.velocidade * dt;
  const contido = conterNaPista(novoX, novoZ);
  carro.position.x = contido.x;
  carro.position.z = contido.z;
  // só freia no instante em que encosta na parede — depois disso ele desliza,
  // sem ficar perdendo velocidade toda hora enquanto raspa na borda
  if (contido.bateu && !estadoCarro.bateuAntes) estadoCarro.velocidade *= 0.75;
  estadoCarro.bateuAntes = contido.bateu;

  // levinho de inclinação ao curvar (só efeito visual)
  const inclinacaoAlvo = (entrada.esquerda ? 0.08 : entrada.direita ? -0.08 : 0) * direcaoGiro;
  carro.rotation.z += (inclinacaoAlvo - carro.rotation.z) * 0.15;

  // turbo
  aneisTurbo.forEach((turbo) => {
    if (!turbo.ativo) return;
    const dist = Math.hypot(carro.position.x - turbo.x, carro.position.z - turbo.z);
    if (dist < 2) {
      estadoCarro.turboAte = performance.now() + 2200;
      estadoCarro.velocidade = Math.max(estadoCarro.velocidade, estadoCarro.velocidadeMax * 0.9);
      turbo.ativo = false;
      turbo.malha.visible = false;
      setTimeout(() => {
        turbo.ativo = true;
        turbo.malha.visible = true;
      }, 4000);
    }
  });

  document.getElementById('hud-velocidade').textContent = `${Math.round(Math.abs(estadoCarro.velocidade) * 3.6)} km/h`;
}

function formatarTempo(ms) {
  const totalDecimos = Math.floor(ms / 100);
  const minutos = Math.floor(totalDecimos / 600);
  const segundos = Math.floor((totalDecimos % 600) / 10);
  const decimo = totalDecimos % 10;
  return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}.${decimo}`;
}

function animar() {
  requestAnimationFrame(animar);
  const dt = Math.min(relogio.getDelta(), 0.05);

  aneisTurbo.forEach((t) => (t.malha.rotation.y += dt));

  if (corridaComecou && !corridaTerminou) {
    passoFisica(dt);
    atualizarVoltas();
    document.getElementById('hud-tempo').textContent = formatarTempo(performance.now() - tempoInicio);
  }

  atualizarCamera();
  renderizador.render(cena, camera);
}

function finalizarCorrida() {
  corridaTerminou = true;
  tempoFinal = performance.now() - tempoInicio;
  document.getElementById('tempo-final').textContent = `Seu tempo: ${formatarTempo(tempoFinal)}`;
  document.getElementById('tela-fim').classList.remove('escondido');
}

function reiniciarCorrida() {
  estadoCarro.velocidade = 0;
  estadoCarro.turboAte = 0;
  estadoCarro.bateuAntes = false;
  carro.position.set((PISTA_A_FORA + PISTA_A_DENTRO) / 2, 0, 0);
  carro.rotation.set(0, 0, 0);
  anguloAnterior = Math.atan2(carro.position.z, carro.position.x);
  passouMetade = false;
  voltaAtual = 1;
  corridaTerminou = false;
  document.getElementById('hud-voltas').textContent = `Volta 1/${TOTAL_VOLTAS}`;
  document.getElementById('tela-fim').classList.add('escondido');
  tempoInicio = performance.now();
  corridaComecou = true;
}

document.getElementById('botao-iniciar').addEventListener('click', () => {
  document.getElementById('tela-inicio').classList.add('escondido');
  tempoInicio = performance.now();
  corridaComecou = true;
});

document.getElementById('botao-reiniciar').addEventListener('click', reiniciarCorrida);

animar();
