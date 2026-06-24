/**
 * loader.cjs — Ponto de entrada para o Phusion Passenger da Hostinger
 *
 * O Passenger não consegue iniciar módulos ES (.mjs / "type":"module")
 * diretamente. Este arquivo CommonJS (.cjs) carrega o app compilado
 * de forma assíncrona, contornando a limitação.
 *
 * No painel hPanel da Hostinger, configure:
 *   Application Startup File: loader.cjs
 */
async function loadApp() {
  await import('./dist/index.js');
}

loadApp().catch((err) => {
  console.error('Falha ao iniciar o servidor:', err);
  process.exit(1);
});
