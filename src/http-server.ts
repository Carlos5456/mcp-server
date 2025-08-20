import express, { Request, Response } from 'express';
import cors from 'cors';
import { MCPServer } from './mcp-server';
import { TenantManager } from './tenant-manager';
import { SSETransport } from './sse-transport';

export class HttpServer {
  private app: express.Application;
  private mcpServer: MCPServer;
  private tenantManager: TenantManager;
  private port: number;

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
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
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
        tenant: {
          id: tenant.id,
          name: tenant.name
        },
        message: 'Tenant configurado com sucesso. Use /{tenant_id}/mcp para conectar ao MCP Server.',
        mcpEndpoint: `/${tenantId}/mcp`
      });
    });

    this.app.get('/:tenantId/mcp', (req: Request, res: Response) => {
      const { tenantId } = req.params;
      const tenant = this.tenantManager.getTenant(tenantId);

      if (!tenant) {
        return res.status(404).json({
          error: 'Tenant não encontrado'
        });
      }

      this.mcpServer.setTenant(tenant);

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      res.write('event: connected\ndata: {"message": "MCP Server conectado"}\n\n');

      const transport = new SSETransport();
      transport.setConnected(true);

      this.mcpServer.handleConnection(transport);

      res.write('event: tools\ndata: {"tools": ["tenant_echo"]}\n\n');

      req.on('close', () => {
        transport.setConnected(false);
        this.mcpServer.handleDisconnection();
        console.log(`Conexão MCP fechada para tenant: ${tenantId}`);
      });

      const heartbeat = setInterval(() => {
        if (req.destroyed) {
          clearInterval(heartbeat);
          return;
        }
        res.write('event: heartbeat\ndata: {"timestamp": "' + new Date().toISOString() + '"}\n\n');
      }, 30000);

      req.on('close', () => {
        clearInterval(heartbeat);
      });
    });

    this.app.post('/:tenantId/execute', async (req: Request, res: Response) => {
      const { tenantId } = req.params;
      const { tool } = req.body;

      const tenant = this.tenantManager.getTenant(tenantId);
      if (!tenant) {
        return res.status(404).json({
          error: 'Tenant não encontrado'
        });
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
          res.status(400).json({
            error: 'Ferramenta não suportada',
            supportedTools: ['tenant_echo']
          });
        }
      } catch (error) {
        res.status(500).json({
          error: 'Erro ao executar ferramenta',
          message: error instanceof Error ? error.message : String(error)
        });
      }
    });

    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'MCP Server SSE funcionando'
      });
    });
  }

  start(): void {
    this.app.listen(this.port, () => {
      console.log(`🚀 MCP Server SSE rodando na porta ${this.port}`);
      console.log(`📋 Endpoints disponíveis:`);
      console.log(`   GET  /health - Health check`);
      console.log(`   GET  /tenants - Listar tenants disponíveis`);
      console.log(`   GET  /{tenant_id} - Configurar tenant específico`);
      console.log(`   GET  /{tenant_id}/mcp - Conectar ao MCP Server via SSE`);
      console.log(`   POST /{tenant_id}/execute - Executar ferramentas MCP`);
      console.log(``);
      console.log(`🔧 Tenants configurados:`);
      this.tenantManager.getAllTenants().forEach(tenant => {
        console.log(`   - ${tenant.id}: ${tenant.name}`);
      });
      console.log(``);
      console.log(`💡 Exemplos de uso:`);
      console.log(`   http://localhost:${this.port}/cliente1`);
      console.log(`   http://localhost:${this.port}/cliente2`);
    });
  }
}
