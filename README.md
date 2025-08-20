# MCP Server SSE - Multi-Tenant

Um servidor MCP (Model Context Protocol) que utiliza Server-Sent Events (SSE) para comunicação e suporta multi-tenancy via path da URL.

## 🚀 Características

- **Protocolo MCP**: Implementa o protocolo oficial Model Context Protocol
- **SSE (Server-Sent Events)**: Comunicação em tempo real via HTTP
- **Multi-Tenant**: Suporte a múltiplos clientes via path da URL
- **Ferramenta HTTP**: Ferramenta integrada para requisições HTTP externas
- **TypeScript**: Desenvolvido em TypeScript com tipagem completa

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn

## 🛠️ Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd mcp-server-sse
```

2. Instale as dependências:
```bash
npm install
```

3. Compile o projeto:
```bash
npm run build
```

## 🚀 Execução

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run build
npm start
```

## 🌐 Endpoints

### Health Check
```
GET /health
```

### Listar Tenants
```
GET /tenants
```

### Configurar Tenant
```
GET /{tenant_id}
```

### Conectar ao MCP Server (SSE)
```
GET /{tenant_id}/mcp
```

### Executar Ferramentas
```
POST /{tenant_id}/execute
```

## 🔧 Tenants Configurados

- **cliente1**: `http://localhost:3000/cliente1`
- **cliente2**: `http://localhost:3000/cliente2`

## 📖 Uso

### 1. Acessar um Tenant
```bash
curl http://localhost:3000/cliente1
```

### 2. Conectar ao MCP Server via SSE
```bash
curl -N http://localhost:3000/cliente1/mcp
```

### 3. Executar Ferramenta HTTP
```bash
curl -X POST http://localhost:3000/cliente1/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "http_request",
    "arguments": {
      "method": "GET",
      "url": "https://api.exemplo.com/dados"
    }
  }'
```

## 🏗️ Arquitetura

```
src/
├── index.ts           # Ponto de entrada
├── http-server.ts     # Servidor HTTP Express
├── mcp-server.ts      # Servidor MCP principal
├── http-tool.ts       # Ferramenta HTTP
├── tenant-manager.ts  # Gerenciador de tenants
├── sse-transport.ts   # Transport SSE
└── types.ts           # Tipos TypeScript
```

## 🔌 Integração com N8N

Para usar no N8N, configure as seguintes URLs:

- **Cliente 1**: `http://localhost:3000/cliente1`
- **Cliente 2**: `http://localhost:3000/cliente2`

O servidor automaticamente detectará o tenant baseado no path da URL e configurará o banco de dados apropriado.

## 🛡️ Segurança

- CORS habilitado para desenvolvimento
- Validação de tenants
- Timeout configurável para requisições HTTP
- Tratamento de erros robusto

## 📝 Logs

O servidor fornece logs detalhados incluindo:
- Conexões MCP
- Execução de ferramentas
- Configuração de tenants
- Erros e exceções

## 🔄 Desenvolvimento

### Watch Mode
```bash
npm run watch
```

### Build
```bash
npm run build
```

## 📄 Licença

MIT

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou problemas, abra uma issue no repositório.
