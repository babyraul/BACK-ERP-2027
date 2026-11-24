### 1. ANTES DE PROGRAMAR (Obligatorio, no escribas código aún)
- **Objetivo verificable:** Define en 1 línea qué debe pasar para dar esto por terminado y cómo se probará.
- **Simulación de fallo:** Imagina que esto salió mal. Lista exactamente las **3 causas más probables y cómo las evitarás**:
  1. [Causa 1] -> [Prevención en el código]
  2. [Causa 2] -> [Prevención en el código]
  3. [Causa 3] -> [Prevención en el código]
Ejemplo:
- Variables o identificadores huérfanos / ReferenceError
- Incompatibilidad de contratos o nombres de campos en desestructuración
- Falta de verificación en caliente / linter del archivo modificado

### 2. AL PROGRAMAR
- **Simplicidad primero:** Usa el mínimo de código posible para resolver el problema. Sin sobre-ingeniería ni abstracciones innecesarias.
- **Cambios quirúrgicos:** Toca SOLO las líneas y archivos estrictamente necesarios. Prohibido refactorizar, formatear o renombrar código vecino que no se pidió.
- **Aplica las 3 prevenciones** definidas en el paso 1.

### 3. AL TERMINAR
- Indica el comando o prueba exacta para verificar que el objetivo se cumplió.

*(Excepción: Si escribo `[FAST]` al inicio, salta el paso 1 y dame solo el cambio quirúrgico).*