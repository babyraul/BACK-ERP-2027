class ApiPeruService {
  constructor() {
    this.token = process.env.API_PERU_TOKEN || '';
    this.baseUrl = process.env.API_PERU_URL || 'https://prorucdni.mifacturaperu.com';
  }

  async consultarDocumento(tipo, numero) {
    const tipoEndpoint = tipo.toUpperCase() === 'RUC' ? 'RUC' : 'DNI';

    // 1. Intentar con la API principal
    if (this.baseUrl) {
      try {
        const response = await fetch(`${this.baseUrl}/documentos/buscar/${tipoEndpoint}/${numero}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data && !data.error && !data.message?.includes?.('No se han encontrado')) {
            return data;
          }
          console.warn(`[ApiPeruService Local] API principal devolvió mensaje de error (${JSON.stringify(data)}). Iniciando fallback...`);
        }
      } catch (error) {
        console.warn(`[ApiPeruService Local] API principal falló (${error.message}). Iniciando fallback scraping...`);
      }
    }

    // 2. Fallback de Scraping / API Secundaria (apis.net.pe)
    return await this.consultarFallback(tipoEndpoint, numero);
  }

  async consultarFallback(tipo, numero) {
    try {
      const url = tipo === 'RUC'
        ? `https://api.apis.net.pe/v1/ruc?numero=${numero}`
        : `https://api.apis.net.pe/v1/dni?numero=${numero}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        return { error: 'Documento no encontrado o no existe' };
      }

      const raw = await response.json();

      if (tipo === 'RUC') {
        return {
          ruc: raw.numeroDocumento,
          razonSocial: raw.nombre,
          nombreComercial: raw.nombre,
          estado: raw.estado || 'ACTIVO',
          condicion: raw.condicion || 'HABIDO',
          direccion: raw.direccion || '',
          ubigeo: raw.ubigeo || '',
          departamento: raw.departamento || '',
          provincia: raw.provincia || '',
          distrito: raw.distrito || ''
        };
      } else {
        return {
          dni: raw.numeroDocumento,
          nombres: raw.nombres,
          apellidoPaterno: raw.apellidoPaterno,
          apellidoMaterno: raw.apellidoMaterno,
          nombreCompleto: raw.nombre
        };
      }
    } catch (err) {
      console.error(`[ApiPeruService Fallback] Error en consulta fallback (${tipo} ${numero}):`, err.message);
      return { error: 'No se pudo obtener información del documento' };
    }
  }
}

module.exports = new ApiPeruService();
