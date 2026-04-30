# Manual del Administrador — OpsManager Skypro360

> Para: Luis (administrador de plataforma, no piloto)
> Versión: 1.0 — 2026-04-30
> Plataforma: https://skp360mgr.systemrapid.io

---

## 1. Tu rol

Eres el **org_admin** del tenant Skypro360. No vuelas, pero todo lo que pasa en la plataforma pasa por ti:

- Alta y baja de pilotos y drones
- Renovación de certificaciones (cuando los pilotos te traen los papeles nuevos)
- Supervisión de operación (qué se está volando, dónde, cuándo)
- Compliance global — que ningún piloto ni drone vuele con docs caducados
- Reporte a AESA cuando aplique
- Soporte de primer nivel a los pilotos

Tu visión es **panorámica**. Los pilotos solo ven sus misiones; tú ves todo.

---

## 2. Acceso y navegación

1. https://skp360mgr.systemrapid.io
2. Tus credenciales — guárdalas en gestor de contraseñas, no en archivos sueltos
3. Toggle modo claro/oscuro: sidebar inferior izquierdo

Las 6 zonas del sidebar (todas accesibles para ti):

| Pestaña | Tu uso principal |
|---------|------------------|
| **Operaciones** | Cockpit — visión general operativa diaria |
| **Espacio OPS** | Mapa táctico — visualizar dónde están operando |
| **Misiones** | Auditoría de misiones, cambios de estado |
| **Flota** | Tu zona — alta/baja drones y pilotos |
| **Compliance** | Tu otra zona — vencimientos, AESA, dossiers |
| **Analytics** | KPIs de operación, horas, métricas comerciales |

---

## 3. Cockpit — tu radar diario

Cuando entras, primer vistazo en 30 segundos:

- **KPIs**: en vuelo / planificadas / drones activos / pilotos válidos
- **Misiones activas**: qué se está ejecutando ahora mismo
- **Panel derecho**:
  - **Alertas AESA · BOE** — publicaciones oficiales relevantes UAS/RPAS
    - Badge naranja = directo sobre drones (regulación, sanciones, certificados)
    - Badge amarillo = relacionado (espacios aéreos, transporte)
    - Badge gris = general
  - **Alertas vencimiento** — pilotos y drones con docs próximos a caducar
  - **Meteo** — referencial, útil cuando coordinas con pilotos por teléfono

Tu trabajo aquí: **revisar alertas BOE 1 vez al día**. Si sale algo crítico (sanciones, cambios regulatorios), avisar al equipo.

---

## 4. Gestión de flota

### 4.1 Alta de un drone nuevo

**Flota → Drones → botón Nuevo drone**

Campos importantes:
- **Modelo** — ej DJI Mavic 3 Enterprise
- **Número de serie** (S/N) — del fabricante
- **Matrícula AESA** (registro UAS) — formato `ES.UAS.YYYY.NNNN` (validación automática)
- **Clase EASA** — C0 / C1 / C2 / C3 / C4 / C5 / C6
- **MTOM** — masa máxima al despegue en kg
- **Seguro**: número póliza + fecha vencimiento
- **Estado** — `active` (operativo), `maintenance`, `retired`, `pending_registration`
- **Fecha de registro AESA**

Al guardar, queda asignado al tenant Skypro360 y disponible para asignar a misiones.

### 4.2 Cambio de estado de drone

- A `maintenance` cuando se manda al taller — bloquea su asignación a misiones nuevas
- A `retired` cuando se da de baja definitivamente
- Vuelves a `active` cuando esté operativo

### 4.3 Alta de un piloto nuevo

**Flota → Pilotos → botón Nuevo piloto**

Campos:
- **Usuario** — primero hay que crear el usuario en el sistema (ver sección 7)
- **Número licencia AESA** — formato `ESP-UAS-PIL-NNNNNN` o `ESP-RPAS-NNNNNN` (validación automática)
- **Habilitaciones**: A1/A3 abierto, A2, STS-01, STS-02, específica
- **Vencimiento certificado**
- **Vencimiento médico**
- **Estado**: `valid` / `expired` / `suspended` / `pending`
- **Horas vuelo iniciales** — si vienen acumuladas de otra plataforma, las metes aquí. Después se actualiza automáticamente con cada vuelo.

### 4.4 Cuando un piloto te trae certificados nuevos

Workflow tipo:
1. Recibes los nuevos documentos (escaneados o físicos)
2. Verificas que son auténticos
3. Editas su ficha en **Flota → Pilotos**
4. Actualizas fecha vencimiento + número si cambió
5. Confirmas que el estado vuelve a `valid` si estaba `expired`

**Las alertas del cockpit dejan de salir automáticamente** cuando metes la fecha nueva.

---

## 5. Compliance — tu segunda zona crítica

### 5.1 Dashboard de compliance

**Pestaña Compliance**:
- **Estado global**: cuántas misiones tienen dossier completo vs incompleto
- **Vencimientos próximos**: pilotos y drones (mismas alertas del cockpit)
- **Templates AESA**: formularios maestros disponibles

### 5.2 Auditar el dossier de una misión

Click en una misión → **Compliance**:
- Verifica que A.4–A.8 están firmados
- Si falta algo, aparece marcado
- Botón **Generar PDF dossier** → descarga el PDF para archivar o entregar a AESA

### 5.3 Si AESA pide auditoría

1. Identificas las misiones afectadas (por fecha, drone, piloto)
2. Generas el PDF dossier de cada una
3. Reúnes los PDFs en un ZIP organizado por código de misión
4. Adjuntas a la respuesta AESA

**Todo el audit log queda en BD** — no se puede borrar. En última instancia JuanCho puede sacar el log forense desde Postgres si AESA pide algo extraordinario.

---

## 6. Misiones — supervisión

Aunque no creas tú las misiones (las crean los pilotos), las **superviasas todas**:

### 6.1 Vista lista
- Filtros por estado, prioridad, piloto, drone
- Ver misiones en cualquier estado, no solo las tuyas

### 6.2 Vista mapa
- Toggle Lista | Mapa en la cabecera de Misiones
- Útil para ver concentraciones geográficas

### 6.3 Cambios de estado por administrador
Solo deberías intervenir en estados si:
- **Cancelar** una misión que el piloto no canceló (ej: cliente la pospone)
- **Aprobar** misiones que esperan validación operativa antes de pasar a `approved`

Nunca toques una misión `in_flight` salvo emergencia.

---

## 7. Gestión de usuarios

> **Nota**: actualmente solo JuanCho puede crear usuarios desde la consola de servidor (estamos en Stage 1 auth — Credentials con bcrypt). Cuando lleguemos a Stage 3 (OAuth), tú podrás crear usuarios desde la UI directamente.

### Mientras tanto:

Cuando incorporas un piloto nuevo:
1. Recoges sus datos: nombre, email, rol (`pilot` / `coordinator` / `viewer`)
2. Mandas a JuanCho: nombre + email + rol
3. JuanCho crea el usuario y te pasa la contraseña inicial
4. Le pasas la contraseña al piloto por canal seguro (WhatsApp privado)
5. **Le exiges que la cambie en el primer login**
6. Tú creas su ficha de Piloto en **Flota → Pilotos** vinculando ese usuario

Roles disponibles:
- **admin** — solo SRS / JuanCho
- **org_admin** — tú
- **pilot** — Fer y resto de pilotos
- **coordinator** — coordinador operativo (puede planificar misiones, no firma A.4 técnico)
- **viewer** — solo lectura, ej cliente externo

---

## 8. Analytics — visión comercial

Pestaña **Analytics**.

Métricas que te interesan:
- Total misiones por mes
- Distribución por estado (cuántas completadas vs abortadas)
- Horas vuelo total por piloto
- Drone más utilizado
- Distribución geográfica (heatmap futuro)

Útil para:
- Reportes mensuales internos a Skypro360
- Justificar amortización de drones
- Dimensionar plantilla de pilotos
- Identificar tendencias

---

## 9. Configuración del tenant

> **Stage 1**: configuración del tenant todavía no tiene UI dedicada. Los datos del operador (nombre comercial, NIF, dirección, responsable de operaciones) se editan vía JuanCho hasta Stage 3.

Lo que SÍ controlas tú:
- Drones (alta/baja)
- Pilotos (alta/baja, edición certificaciones)
- Misiones (supervisión, cancelación)
- Compliance (firmas, dossiers)

---

## 10. Tu rutina semanal recomendada

| Día | Tarea |
|-----|-------|
| **Lunes** | Revisar alertas vencimiento del cockpit. Cualquiera < 30 días → avisar piloto |
| **Lunes** | Revisar BOE de la semana anterior — ¿hay novedades regulatorias? |
| **Diario** | Echar un vistazo al cockpit (1 minuto) — ¿hay misiones in_flight? ¿alertas nuevas? |
| **Final de mes** | Generar PDFs dossier de todas las misiones completadas del mes y archivar |
| **Final de mes** | Sacar Analytics → reporte mensual a Skypro360 |
| **Trimestral** | Revisar caducidades a 90 días vista — anticipar renovaciones |

---

## 11. Soporte — qué hacer cuando un piloto te llama

### Caso 1: "No puedo pasar mi misión a in_flight"
- Verifica: ¿tiene drone asignado? ¿tiene piloto asignado? ¿está el A.4 firmado?
- Si falta algo → tienes que decirle qué falta y dejar que él lo arregle

### Caso 2: "Mi certificado caducó pero ya lo renové"
- Le pides foto del nuevo certificado
- Editas su ficha en Flota → Pilotos → cambias fecha vencimiento
- Si el estado quedó en `expired`, lo pasas a `valid`

### Caso 3: "El mapa no carga NOTAMs"
- Refrescar (Ctrl+R)
- Si persiste: revisar https://www.enaire.es/notams (fuente upstream — si está caída, la nuestra también)
- Avisar JuanCho

### Caso 4: "Olvidé mi contraseña"
- Stage 1: pasarle a JuanCho para reset manual
- Stage 3+ (futuro): ellos podrán hacer reset automático por email

### Caso 5: "El PDF dossier sale incompleto"
- Verificar que TODOS los formularios A.4–A.8 que apliquen están firmados
- Si una sección falta y debería estar → puede ser bug, captura + JuanCho

---

## 12. Reglas de oro

1. **Nunca borres datos manualmente** — todo lo que se borra deja rastro en audit log, pero recuperar es lento
2. **Las firmas digitales son legales** — trata el sistema con seriedad notarial
3. **No compartas credenciales** — cada usuario su login. Si dos personas entran con la misma cuenta, no sabemos quién hizo qué
4. **Los dossiers PDF son entregables** — guárdalos con la misma seriedad que un contrato
5. **Las alertas BOE son tu sistema de aviso temprano** — un cambio regulatorio ignorado puede costar cara la siguiente auditoría AESA

---

## 13. Roadmap — lo que viene

| Próximamente | Qué te aporta |
|--------------|---------------|
| Roles UI estricto | Pilotos verán solo sus misiones — menos ruido para ellos, mejor compliance interno |
| Email notifications | Avisos automáticos de vencimientos, cambios de estado críticos |
| Modo claro en mapa | El mapa se adaptará al tema |
| Subdominios por tenant | `skypro360.opsmanager.es` cuando crezcamos a 3+ operadores |
| Telemetría real-time | Cuando integremos con sistemas de los drones, verás posición en vivo |
| App móvil PWA | Para que los pilotos firmen formularios desde móvil offline |

---

> Cualquier duda crítica → JuanCho directamente.
> Cualquier mejora que quieras → la pides en Notion y entra en backlog.
> Esto es **tu plataforma**, hazla tuya.
