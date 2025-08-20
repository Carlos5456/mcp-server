import { TenantConfig, HttpRequestParams, HttpRequestResult } from './types';

export class HttpTool {
  readonly name = 'http_request';
  readonly description = 'Executa requisições HTTP para APIs externas';
  readonly inputSchema = {
    type: 'object',
    properties: {
      method: {
        type: 'string',
        enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        description: 'Método HTTP a ser usado'
      },
      url: {
        type: 'string',
        description: 'URL da requisição'
      },
      headers: {
        type: 'object',
        additionalProperties: { type: 'string' },
        description: 'Headers da requisição'
      },
      body: {
        description: 'Corpo da requisição (para POST, PUT, PATCH)'
      },
      timeout: {
        type: 'number',
        description: 'Timeout em milissegundos'
      }
    },
    required: ['method', 'url']
  };

  constructor(private tenant: TenantConfig) {}

  async call(params: any): Promise<any> {
    try {
      const { method, url, headers = {}, body, timeout = 30000 } = params.arguments as HttpRequestParams;

      console.log(`[${this.tenant.id}] Executando requisição HTTP: ${method} ${url}`);

      const startTime = Date.now();
      
      const response = await this.executeHttpRequest(method, url, headers, body, timeout);
      
      const duration = Date.now() - startTime;

      const result: HttpRequestResult = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: await this.parseResponseBody(response),
        duration
      };

      console.log(`[${this.tenant.id}] Requisição concluída em ${duration}ms - Status: ${response.status}`);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };

    } catch (error) {
      console.error(`[${this.tenant.id}] Erro na requisição HTTP:`, error);
      
      return {
        content: [
          {
            type: 'text',
            text: `Erro na requisição HTTP: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }

  private async executeHttpRequest(
    method: string, 
    url: string, 
    headers: Record<string, string>, 
    body: any, 
    timeout: number
  ): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async parseResponseBody(response: any): Promise<any> {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return await response.json();
    } else if (contentType?.includes('text/')) {
      return await response.text();
    } else {
      return await response.arrayBuffer();
    }
  }
}
