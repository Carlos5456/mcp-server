import { HttpTool } from './http-tool';
import { TenantManager, TenantConfig } from './tenant-manager';

export class MCPServer {
  private tenantManager: TenantManager;
  private currentTenant: TenantConfig | null = null;
  private server: any | null = null;

  constructor() {
    this.tenantManager = new TenantManager();
  }

  setTenant(tenant: TenantConfig | null): void {
    this.currentTenant = tenant;
    console.log(`Tenant definido: ${tenant ? tenant.name : 'nenhum'}`);
  }

  private async ensureServer(): Promise<void> {
    if (this.server) return;
    const { Server } = await import('@modelcontextprotocol/sdk/server/index.js');
    const { CallToolRequestSchema, ListToolsRequestSchema } = await import('@modelcontextprotocol/sdk/types.js');

    this.server = new Server({ name: 'mcp-server-sse', version: '1.0.0' });

    // Handlers MCP oficiais
    this.server.setRequestHandler(ListToolsRequestSchema as any, this.handleListTools.bind(this));
    this.server.setRequestHandler(CallToolRequestSchema as any, this.handleCallTool.bind(this));
  }

  private async handleListTools(): Promise<any> {
    if (!this.currentTenant) {
      return { tools: [] };
    }
    const tool = new HttpTool(this.currentTenant);
    return {
      tools: [
        {
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        }
      ]
    };
  }

  private async handleCallTool(params: any): Promise<any> {
    if (!this.currentTenant) {
      return {
        content: [{ type: 'text', text: 'Erro: Nenhum tenant configurado' }],
        isError: true
      };
    }

    if (params.name === 'tenant_echo') {
      const tool = new HttpTool(this.currentTenant);
      return await tool.call(params);
    }

    return {
      content: [{ type: 'text', text: `Ferramenta não encontrada: ${params.name}` }],
      isError: true
    };
  }

  async connect(transport: any): Promise<void> {
    await this.ensureServer();
    await this.server.connect(transport);
  }

  async close(): Promise<void> {
    if (this.server) {
      await this.server.close();
    }
  }
}
