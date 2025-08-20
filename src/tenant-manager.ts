import { TenantConfig } from './types';

export { TenantConfig };

export class TenantManager {
  private tenants: Map<string, TenantConfig> = new Map();

  constructor() {
    // Configuração inicial dos tenants
    this.tenants.set('cliente1', {
      id: 'cliente1',
      databaseUrl: 'postgresql://cliente1:password@localhost:5432/cliente1_db',
      name: 'Cliente 1'
    });

    this.tenants.set('cliente2', {
      id: 'cliente2',
      databaseUrl: 'postgresql://cliente2:password@localhost:5432/cliente2_db',
      name: 'Cliente 2'
    });
  }

  getTenant(path: string): TenantConfig | null {
    // Remove a barra inicial se existir
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    // Se o path estiver vazio, retorna null
    if (!cleanPath) {
      return null;
    }

    return this.tenants.get(cleanPath) || null;
  }

  getAllTenants(): TenantConfig[] {
    return Array.from(this.tenants.values());
  }

  addTenant(tenant: TenantConfig): void {
    this.tenants.set(tenant.id, tenant);
  }

  removeTenant(tenantId: string): boolean {
    return this.tenants.delete(tenantId);
  }
}
