import express, { Request, Response } from 'express';
import cors from 'cors';
import { MCPServer } from './mcp-server';
import { TenantManager } from './tenant-manager';

export class HttpServer {
  private app: express.Application;
  private mcpServer: MCPServer;
  private tenantManager: TenantManager;
  private port: number;

  // Armazena transports ativos por tenant
  private transports: Map<string, any> = new Map();

  constructor(port: number = 3000) {
    this.port = port;
    this.mcpServer = new MCPServer();
    this.tenantManager = new TenantManager();
    
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    // Removido body parser global para não interferir no POST do SDK (/:tenantId/mcp)
  }

  private setupRoutes(): void {
    this.app.get('/tenants', (req: Request, res: Response) => {
      const tenants = this.tenantManager.getAllTenants();
      res.json({
        tenants: tenants.map(t => ({ id: t.id, name: t.name })),
        message: 'Use /{tenant_id} para acessar um tenant específico'
      });
    });

    this.app.get('/:tenantId', (req: Request, res: Response) => {
      const { tenantId } = req.params;
      const tenant = this.tenantManager.getTenant(tenantId);

      if (!tenant) {
        return res.status(404).json({
          error: 'Tenant não encontrado',
          availableTenants: this.tenantManager.getAllTenants().map(t => t.id)
        });
      }

      this.mcpServer.setTenant(tenant);

      res.json({
        tenant: { id: tenant.id, name: tenant.name },
        message: 'Tenant configurado com sucesso. Use /{tenant_id}/mcp para conectar ao MCP Server.',
        mcpEndpoint: `/${tenantId}/mcp`
      });
    });

    // Endpoint MCP SSE: GET abre o stream e informa o endpoint de POST ao cliente
    this.app.get('/:tenantId/mcp', async (req: Request, res: Response) => {
      const { tenantId } = req.params;
      const tenant = this.tenantManager.getTenant(tenantId);

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant não encontrado' });
      }

      this.mcpServer.setTenant(tenant);

      const { SSEServerTransport } = await import('@modelcontextprotocol/sdk/server/sse.js');

      // Usamos o MESMO path para POST (o SDK instruirá o cliente)
      const transport = new SSEServerTransport(`/${tenantId}/mcp`, res as any);

      // Inicia o SSE e conecta o servidor MCP
      await transport.start();
      await this.mcpServer.connect(transport);

      this.transports.set(tenant.id, transport);

      req.on('close', async () => {
        try { await this.mcpServer.close(); } catch {}
        try { await transport.close(); } catch {}
        this.transports.delete(tenant.id);
        console.log(`Conexão MCP fechada para tenant: ${tenantId}`);
      });
    });

    // Endpoint MCP: POST recebe mensagens do cliente e repassa ao transport (sem body parser)
    this.app.post('/:tenantId/mcp', async (req: Request, res: Response) => {
      const { tenantId } = req.params;
      const tenant = this.tenantManager.getTenant(tenantId);
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant não encontrado' });
      }

      const transport = this.transports.get(tenant.id);
      if (!transport) {
        return res.status(409).json({ error: 'Stream SSE não está aberto para este tenant' });
      }

      await transport.handlePostMessage(req as any, res as any);
    });

    // Endpoint simples para executar a ferramenta diretamente (útil para testes) — usa body parser apenas aqui
    this.app.post('/:tenantId/execute', express.json(), async (req: Request, res: Response) => {
      const { tenantId } = req.params;
      const { tool } = req.body;

      const tenant = this.tenantManager.getTenant(tenantId);
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant não encontrado' });
      }

      this.mcpServer.setTenant(tenant);

      try {
        if (tool === 'tenant_echo') {
          const result = {
            tenant: tenant.id,
            tool: tool,
            result: `Requisição vinda do ${tenant.name || tenant.id}`,
            timestamp: new Date().toISOString()
          };
          res.json(result);
        } else {
          res.status(400).json({ error: 'Ferramenta não suportada', supportedTools: ['tenant_echo'] });
        }
      } catch (error) {
        res.status(500).json({ error: 'Erro ao executar ferramenta', message: error instanceof Error ? error.message : String(error) });
      }
    });

    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString(), message: 'MCP Server SSE funcionando' });
    });
  }

  start(): void {
    this.app.listen(this.port, () => {
      console.log(`🚀 MCP Server SSE rodando na porta ${this.port}`);
      console.log(`📋 Endpoints:`);
      console.log(`   GET  /health`);
      console.log(`   GET  /tenants`);
      console.log(`   GET  /{tenant_id}`);
      console.log(`   GET  /{tenant_id}/mcp   (SSE)`);
      console.log(`   POST /{tenant_id}/mcp   (mensagens do cliente)`);
      console.log(`   POST /{tenant_id}/execute`);
    });
  }
}
