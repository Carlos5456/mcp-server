import { HttpServer } from './http-server';

async function main() {
  try {
    console.log('🚀 Iniciando MCP Server SSE...');
    
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    const server = new HttpServer(port);
    
    server.start();
    
    console.log('✅ Servidor iniciado com sucesso!');
    console.log(`🌐 Acesse: http://localhost:${port}`);
    
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Tratamento de sinais para graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Recebido SIGINT, encerrando servidor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Recebido SIGTERM, encerrando servidor...');
  process.exit(0);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
  process.exit(1);
});

main();
