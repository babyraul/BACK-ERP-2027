const postgres = require('postgres');
require('dotenv').config();

async function syncPermisos() {
  const sql = postgres(process.env.DATABASE_URL);
  
  try {
    const modulos = await sql`SELECT id, codigo, nombre, tipo FROM modulos WHERE tipo = 'MENU'`;
    const permisosActuales = await sql`SELECT id, codigo FROM permisos`;
    
    let creados = 0;
    
    for (const menu of modulos) {
      const acciones = ['ver', 'crear', 'editar', 'eliminar'];
      for (const accion of acciones) {
        const codigoBuscado = `${menu.codigo.toLowerCase()}.${accion}`;
        const existe = permisosActuales.find(p => p.codigo === codigoBuscado);
        
        const verb = accion === 'eliminar' ? 'Inactivar' : (accion.charAt(0).toUpperCase() + accion.slice(1));
        const nombreGenerado = `${verb} ${menu.nombre.toLowerCase()}`;

        if (!existe) {
          await sql`
            INSERT INTO permisos (modulo_id, codigo, nombre, descripcion)
            VALUES (
              ${menu.id}, 
              ${codigoBuscado}, 
              ${nombreGenerado}, 
              'Permiso automático de sincronización'
            )
          `;
          creados++;
        } else if (accion === 'eliminar' && existe.nombre && existe.nombre.startsWith('Eliminar')) {
          await sql`
            UPDATE permisos 
            SET nombre = ${nombreGenerado}
            WHERE id = ${existe.id}
          `;
        }
      }
    }
    
    console.log(`Sincronización completada. ${creados} permisos creados.`);
  } catch (error) {
    console.error('Error al sincronizar:', error);
  } finally {
    await sql.end();
  }
}

syncPermisos();
