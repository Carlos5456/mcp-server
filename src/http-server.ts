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
    // Rota para listar todos os tenants disponíveis
    this.app.get('/tenants', (req: Request, res: Response) => {
      const tenants = this.tenantManager.getAllTenants();
      res.json({
        tenants: tenants.map(t => ({ id: t.id, name: t.name })),
        message: 'Use /{tenant_id} para acessar um tenant específico'
      });
    });

    // Rota para acessar um tenant específico via path
    this.app.get('/:tenantId', (req: Request, res: Response) => {
      const { tenantId } = req.params;
      const tenant = this.tenantManager.getTenant(tenantId);

      if (!tenant) {
        return res.status(404).json({
          error: 'Tenant não encontrado',
          availableTenants: this.tenantManager.getAllTenants().map(t => t.id)
        });
      }

      // Configurar o tenant atual no MCP Server
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

    // Endpoint MCP para um tenant específico
    this.app.get('/:tenantId/mcp', (req: Request, res: Response) => {
      const { tenantId } = req.params;
      const tenant = this.tenantManager.getTenant(tenantId);

      if (!tenant) {
        return res.status(404).json({
          error: 'Tenant não encontrado'
        });
      }

      // Configurar o tenant atual
      this.mcpServer.setTenant(tenant);

      // Configurar headers para SSE
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Enviar evento de conexão
      res.write('event: connected\ndata: {"message": "MCP Server conectado"}\n\n');

      // Criar transport SSE
      const transport = new SSETransport();
      transport.setConnected(true);

      // Conectar ao MCP Server
      this.mcpServer.handleConnection(transport);

      // Enviar lista de ferramentas disponíveis
      res.write('event: tools\ndata: {"tools": ["http_request"]}\n\n');

      // Manter conexão aberta
      req.on('close', () => {
        transport.setConnected(false);
        this.mcpServer.handleDisconnection();
        console.log(`Conexão MCP fechada para tenant: ${tenantId}`);
      });

      // Enviar heartbeat a cada 30 segundos
      const heartbeat = setInterval(() => {
        if (req.destroyed) {
          clearInterval(heartbeat);
          return;
        }
        res.write('event: heartbeat\ndata: {"timestamp": "' + new Date().toISOString() + '"}\n\n');
      }, 30000);

      // Limpar heartbeat quando a conexão for fechada
      req.on('close', () => {
        clearInterval(heartbeat);
      });
    });

    // Endpoint para executar ferramentas MCP
    this.app.post('/:tenantId/execute', async (req: Request, res: Response) => {
      const { tenantId } = req.params;
      const { tool, arguments: args } = req.body;

      const tenant = this.tenantManager.getTenant(tenantId);
      if (!tenant) {
        return res.status(404).json({
          error: 'Tenant não encontrado'
        });
      }

      // Configurar o tenant atual
      this.mcpServer.setTenant(tenant);

      try {
        // Simular chamada da ferramenta
        if (tool === 'http_request') {
          const result = {
            tenant: tenant.id,
            tool: tool,
            arguments: args,
            timestamp: new Date().toISOString(),
            message: 'Ferramenta executada com sucesso'
          };

          res.json(result);
        } else {
          res.status(400).json({
            error: 'Ferramenta não suportada',
            supportedTools: ['http_request']
          });
        }
      } catch (error) {
        res.status(500).json({
          error: 'Erro ao executar ferramenta',
          message: error instanceof Error ? error.message : String(error)
        });
      }
    });

    // Rota de health check
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
