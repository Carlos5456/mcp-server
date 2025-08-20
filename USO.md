# 📖 Guia de Uso - MCP Server SSE

## 🎯 **Visão Geral**

Este documento explica como usar corretamente o MCP Server SSE (Server-Sent Events) que implementa o protocolo Model Context Protocol com suporte a multi-tenancy via path da URL.

## 🚀 **Endpoints Disponíveis**

### 1. **Health Check (sem tenant)**
```
GET http://localhost:3000/health
```
**Descrição**: Verifica o status do servidor
**Resposta esperada**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "MCP Server SSE funcionando"
}
```

### 2. **Listar Tenants Disponíveis**
```
GET http://localhost:3000/tenants
```
**Descrição**: Retorna a lista de todos os tenants configurados
**Resposta esperada**:
```json
{
  "tenants": [
    {
      "id": "cliente1",
      "name": "Cliente 1"
    },
    {
      "id": "cliente2",
      "name": "Cliente 2"
    }
  ],
  "message": "Use /{tenant_id} para acessar um tenant específico"
}
```

### 3. **Acessar um Tenant Específico**
```
GET http://localhost:3000/cliente1
GET http://localhost:3000/cliente2
```
**Descrição**: Configura o tenant atual e retorna informações sobre ele
**Resposta esperada**:
```json
{
  "tenant": {
    "id": "cliente1",
    "name": "Cliente 1"
  },
  "message": "Tenant configurado com sucesso. Use /{tenant_id}/mcp para conectar ao MCP Server.",
  "mcpEndpoint": "/cliente1/mcp"
}
```

### 4. **Conectar ao MCP Server via SSE**
```
GET http://localhost:3000/cliente1/mcp
GET http://localhost:3000/cliente2/mcp
```
**Descrição**: Estabelece uma conexão Server-Sent Events (SSE) com o MCP Server
**Tipo de resposta**: Event stream (SSE)
**Eventos enviados**:
- `connected`: Confirmação de conexão
- `tools`: Lista de ferramentas disponíveis
- `heartbeat`: Pulsação a cada 30 segundos

### 5. **Executar Ferramentas MCP**
```
POST http://localhost:3000/cliente1/execute
POST http://localhost:3000/cliente2/execute
```
**Descrição**: Executa ferramentas MCP para o tenant especificado
**Headers necessários**: `Content-Type: application/json`
**Body (JSON)**:
```json
{
  "tool": "http_request",
  "arguments": {
    "method": "GET",
    "url": "https://httpbin.org/get",
    "headers": {
      "Authorization": "Bearer token123"
    },
    "timeout": 30000
  }
}
```

## 🧪 **Testes no Postman**

### **Teste 1: Health Check**
1. Método: `GET`
2. URL: `http://localhost:3000/health`
3. **Resultado esperado**: Status 200 com informações do servidor

### **Teste 2: Acessar Tenant**
1. Método: `GET`
2. URL: `http://localhost:3000/cliente1`
3. **Resultado esperado**: Status 200 com informações do tenant

### **Teste 3: Executar Ferramenta HTTP**
1. Método: `POST`
2. URL: `http://localhost:3000/cliente1/execute`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "tool": "http_request",
  "arguments": {
    "method": "GET",
    "url": "https://httpbin.org/get"
  }
}
```
5. **Resultado esperado**: Status 200 com resultado da requisição HTTP

## 🔌 **Integração com N8N**

### **Configuração no N8N**
Configure as seguintes URLs no N8N:

- **Cliente 1**: `http://localhost:3000/cliente1`
- **Cliente 2**: `http://localhost:3000/cliente2`

### **Como funciona**
1. O N8N envia requisições para a URL do tenant
2. O servidor detecta automaticamente o tenant baseado no path
3. O servidor configura o banco de dados apropriado para o tenant
4. As ferramentas MCP são executadas no contexto do tenant correto

## 🛠️ **Ferramentas MCP Disponíveis**

### **http_request**
**Descrição**: Executa requisições HTTP para APIs externas

**Parâmetros**:
- `method` (obrigatório): Método HTTP (GET, POST, PUT, DELETE, PATCH)
- `url` (obrigatório): URL da requisição
- `headers` (opcional): Headers da requisição
- `body` (opcional): Corpo da requisição (para POST, PUT, PATCH)
- `timeout` (opcional): Timeout em milissegundos (padrão: 30000)

**Exemplo de uso**:
```json
{
  "tool": "http_request",
  "arguments": {
    "method": "POST",
    "url": "https://api.exemplo.com/dados",
    "headers": {
      "Authorization": "Bearer token123",
      "Content-Type": "application/json"
    },
    "body": {
      "nome": "João",
      "idade": 30
    },
    "timeout": 60000
  }
}
```

## 📝 **Logs e Monitoramento**

### **Logs do Servidor**
O servidor fornece logs detalhados incluindo:
- Conexões MCP estabelecidas
- Execução de ferramentas
- Configuração de tenants
- Erros e exceções
- Heartbeats SSE

### **Monitoramento**
- **Health Check**: `/health` para verificar status
- **Tenants**: `/tenants` para listar tenants disponíveis
- **Logs**: Console do servidor para debugging

## ❌ **Tratamento de Erros**

### **Erro: Tenant não encontrado**
```json
{
  "error": "Tenant não encontrado",
  "availableTenants": ["cliente1", "cliente2"]
}
```
**Solução**: Use um dos tenants disponíveis no path da URL

### **Erro: Ferramenta não suportada**
```json
{
  "error": "Ferramenta não suportada",
  "supportedTools": ["http_request"]
}
```
**Solução**: Use apenas as ferramentas listadas em `supportedTools`

### **Erro: Nenhum tenant configurado**
```json
{
  "error": "Nenhum tenant configurado"
}
```
**Solução**: Acesse primeiro um endpoint de tenant específico

## 🔄 **Fluxo de Uso Recomendado**

1. **Verificar status**: `GET /health`
2. **Listar tenants**: `GET /tenants`
3. **Configurar tenant**: `GET /cliente1` ou `GET /cliente2`
4. **Conectar MCP**: `GET /cliente1/mcp` (para SSE)
5. **Executar ferramentas**: `POST /cliente1/execute`

## 📚 **Exemplos Práticos**

### **Exemplo 1: Consulta de API Externa**
```bash
curl -X POST http://localhost:3000/cliente1/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "http_request",
    "arguments": {
      "method": "GET",
      "url": "https://jsonplaceholder.typicode.com/posts/1"
    }
  }'
```

### **Exemplo 2: Envio de Dados**
```bash
curl -X POST http://localhost:3000/cliente2/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "http_request",
    "arguments": {
      "method": "POST",
      "url": "https://httpbin.org/post",
      "body": {
        "cliente": "cliente2",
        "acao": "teste"
      }
    }
  }'
```

## 🚨 **Troubleshooting**

### **Problema: Servidor não responde**
- Verifique se o servidor está rodando: `npm start`
- Verifique a porta 3000: `netstat -an | findstr :3000`

### **Problema: Erro de CORS**
- O servidor já tem CORS habilitado
- Verifique se está acessando de `localhost:3000`

### **Problema: Conexão SSE falha**
- Verifique se o endpoint `/mcp` está sendo acessado
- Use um cliente que suporte SSE (Postman, navegador, etc.)

## 📞 **Suporte**

Para problemas ou dúvidas:
1. Verifique os logs do servidor
2. Teste os endpoints básicos primeiro
3. Confirme se o tenant está sendo configurado corretamente
4. Verifique se as ferramentas estão sendo chamadas com os parâmetros corretos
