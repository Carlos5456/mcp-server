import { HttpTool } from './http-tool';
import { TenantManager, TenantConfig } from './tenant-manager';

export class MCPServer {
  private tenantManager: TenantManager;
  private currentTenant: TenantConfig | null = null;

  constructor() {
    this.tenantManager = new TenantManager();
  }

  setTenant(tenant: TenantConfig | null): void {
    this.currentTenant = tenant;
    console.log(`Tenant definido: ${tenant ? tenant.name : 'nenhum'}`);
  }

  async handleListTools(): Promise<any> {
    if (!this.currentTenant) {
      return {
        tools: []
      };
    }

    const httpTool = new HttpTool(this.currentTenant);
    
    return {
      tools: [
        {
          name: httpTool.name,
          description: httpTool.description,
          inputSchema: httpTool.inputSchema
        }
      ]
    };
  }

  async handleCallTool(params: any): Promise<any> {
    if (!this.currentTenant) {
      return {
        content: [
          {
            type: 'text',
            text: 'Erro: Nenhum tenant configurado'
          }
        ],
        isError: true
      };
    }

    if (params.name === 'http_request') {
      const httpTool = new HttpTool(this.currentTenant);
      return await httpTool.call(params);
    }

    return {
      content: [
        {
          type: 'text',
          text: `Ferramenta não encontrada: ${params.name}`
        }
      ],
      isError: true
    };
  }

  async handleConnection(transport: any): Promise<void> {
    try {
      console.log('Conexão MCP estabelecida');
    } catch (error) {
      console.error('Erro na conexão MCP:', error);
    }
  }

  async handleDisconnection(): Promise<void> {
    try {
      console.log('Conexão MCP fechada');
    } catch (error) {
      console.error('Erro ao fechar conexão MCP:', error);
    }
  }
}
