import { TenantConfig } from './types';
export class HttpTool {
  readonly name = 'tenant_echo';
  readonly description = 'Retorna um texto simples indicando de qual tenant veio a requisição';
  readonly inputSchema = {
    type: 'object',
    properties: {},
    additionalProperties: false
  };

  constructor(private tenant: TenantConfig) {}

  async call(_params: any): Promise<any> {
    const message = `Requisição vinda do ${this.tenant.name || this.tenant.id}`;

    return {
      content: [
        {
          type: 'text',
          text: message
        }
      ]
    };
  }
}
