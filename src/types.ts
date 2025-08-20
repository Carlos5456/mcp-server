export interface TenantConfig {
  id: string;
  databaseUrl: string;
  name: string;
}

export interface HttpRequestParams {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export interface HttpRequestResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  duration: number;
}
