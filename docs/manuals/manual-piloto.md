# Manual del Piloto — OpsManager Skypro360

> Para: Fer (piloto senior + formador)
> Versión: 1.0 — 2026-04-30
> Plataforma: https://skp360mgr.systemrapid.io

---

## 1. Tu primer login

1. Abre https://skp360mgr.systemrapid.io
2. Email: el que te dio JuanCho
3. Contraseña: la inicial — cámbiala en cuanto entres

Toda la app es **dark cockpit por defecto**. Si prefieres claro: esquina inferior izquierda del sidebar, icono sol/luna. Tu preferencia se recuerda en el navegador.

---

## 2. Las 6 zonas del sidebar

| Pestaña | Para qué |
|---------|----------|
| **Operaciones** | Cockpit home — KPIs, misiones activas, historial, alertas |
| **Espacio OPS** | Mapa táctico completo — NOTAMs, misiones georreferenciadas |
| **Misiones** | Lista o mapa de todas las misiones — crear, editar, cambiar estado |
| **Flota** | Drones y pilotos del operador con sus certificaciones |
| **Compliance** | Formularios AESA A.4–A.8, firmas, PDF dossier |
| **Analytics** | Métricas de operación — horas vuelo, misiones por estado |

---

## 3. Tu rutina diaria — antes de volar

### Paso 1: Cockpit (Operaciones)

Cuando entras, lo primero que ves:

- **KPIs arriba**: cuántas misiones en vuelo, planificadas, drones activos, pilotos válidos
- **Misiones activas**: tarjetas con código SKY-XXX + drone + piloto asignado
- **Panel derecho** (lo más importante para ti):
  - Alertas AESA · BOE — publicaciones oficiales relevantes para UAS
  - Alertas vencimiento certificados — si tu médico o licencia caducan pronto, aquí lo ves
  - Meteo — selecciona la ciudad o misión activa, te dice si es **apto vuelo**

### Paso 2: Espacio OPS — verifica NOTAMs

Antes de cualquier vuelo:
1. Click en pestaña **Espacio OPS**
2. Localiza la zona donde vas a volar
3. Las áreas azules son **NOTAMs activos** (678 reales de ENAIRE)
4. Click en una zona NOTAM → popup con:
   - ID del NOTAM
   - Altitud (suelo → techo)
   - Descripción de la restricción
   - Período activo
5. Click otra vez para cerrar

**Si tu zona de vuelo cae dentro de un NOTAM → no vueles sin autorización específica.**

### Paso 3: Meteo de la zona

Vuelve al **Cockpit** o al panel derecho del **Espacio OPS** cuando hayas seleccionado tu misión:

- Temperatura mín/máx del día
- Viento: velocidad y dirección
- Precipitación: probabilidad
- Badge **Apto vuelo / No apto** — basado en límites estándar UAS

Fuente: AEMET OpenData (datos oficiales españoles).

---

## 4. Crear una misión nueva

**Pestaña Misiones → botón Nueva misión**

Campos obligatorios:
- **Nombre** — descriptivo, ej "Inspección torre subestación Mérida"
- **Prioridad** — low / medium / high / critical
- **Drone** — selector con tu flota disponible
- **Piloto** — selector con pilotos certificados
- **Fecha/hora programada**
- **Coordenadas** (lat / lng) — opcional pero recomendado para que aparezca en el mapa
- **Altitud máxima** — en metros AGL
- **Clase SORA** — STS-01 / STS-02 / específica

El **código SKY-2026-XXX** se genera automáticamente al guardar.

La misión nace en estado **draft**.

---

## 5. Estados de misión y transiciones

```
draft → planned → approved → preflight → in_flight → completed
                                      ↓
                                   aborted / cancelled
```

| Estado | Quién y cuándo |
|--------|----------------|
| **draft** | Recién creada, editable libremente |
| **planned** | Listada, falta aprobación operativa |
| **approved** | Lista para volar |
| **preflight** | Checklist pre-vuelo + AESA A.4 firmado |
| **in_flight** | Drone en el aire — meteo y telemetría activas |
| **completed** | Vuelo terminado + post-flight A.5/A.6 firmado |
| **aborted** | Misión cortada en vuelo (incidente A.8) |
| **cancelled** | No se ejecutó (motivo libre) |

**No puedes saltar estados.** El sistema valida cada transición.

**Para pasar a `in_flight` la misión debe tener drone + piloto asignados y el A.4 firmado.**

---

## 6. Compliance AESA — formularios A.4 a A.8

Pestaña **Compliance** o desde dentro de la misión → botón **Compliance**.

### A.4 — Planificación operacional (pre-vuelo)
- Análisis de la zona, riesgos, espacios aéreos
- **Firma digital del piloto** — pad táctil, firma en pantalla
- Bloquea el paso a `preflight`

### A.5 — Pre-flight checklist
- Estado del drone (batería, integridad estructural, cámaras)
- Comprobación radioenlace
- Firma piloto

### A.6 — Briefing equipo (si hay observador o copiloto)
- Asignación de roles
- Comunicaciones acordadas

### A.7 — Post-flight log
- Horas voladas
- Incidencias menores (campo libre)
- Estado final del drone (devuelto a hangar OK / requiere mantenimiento)

### A.8 — Reporte de incidente (solo si aplica)
- Si el vuelo se aborta o hay incidente
- Detalles, evidencias, acción correctiva

### Anexo I — Manual de operaciones aplicable
- Referencia al SOR del operador

**Todos los formularios se firman digitalmente** (pad de firma en pantalla, generamos hash + timestamp).

---

## 7. PDF dossier — el entregable AESA

Una vez completados los formularios de la misión:

**Compliance → botón Generar dossier PDF**

Sale un PDF único con:
- Portada con datos del operador (Skypro360)
- Datos de la misión (código, fechas, ubicación)
- A.4 + firma piloto
- A.5 + firma piloto
- A.6 (si aplica)
- A.7 + horas voladas calculadas
- A.8 (si aplica)
- Anexos

**Este PDF es el que se entrega a AESA en caso de auditoría o inspección.** Guárdalo en tu sistema documental.

---

## 8. Tu zona personal — Flota

Pestaña **Flota → Pilotos → tu ficha**.

Verás:
- Licencia (número y vencimiento)
- Certificado médico (vencimiento)
- Habilitaciones (A1/A3, A2, STS, específica)
- Horas de vuelo acumuladas (suma automática de cada A.7)

**Si algún documento está a < 30 días de caducar, aparece en alertas del cockpit.**

Hablar con Luis (admin) para renovar fechas en plataforma cuando los actualices.

---

## 9. Flujo completo — caso real

> **Misión**: inspección torre eléctrica en Herrera del Duque, 4 de mayo 11:00.

1. **Día anterior** — entras al cockpit → revisas alertas vencimiento (todo OK) → revisas BOE (sin novedades regulatorias)
2. **Espacio OPS** → centras Herrera del Duque → confirmas que no hay NOTAM activo en la zona → verificas meteo (vientos < 25 km/h, sin precipitación → apto vuelo)
3. **Misiones → Nueva** → rellenas datos → guardar (estado `draft`)
4. **Editas la misión** → `planned` → `approved`
5. **Compliance → A.4** → rellenas planificación → firmas → estado pasa a `preflight`
6. **En el lugar de vuelo** → A.5 pre-flight checklist → firmas
7. **Cambias estado a `in_flight`** → vuela
8. **Aterrizas** → A.7 post-flight → horas voladas → firmas → estado `completed`
9. **Generar dossier PDF** → archivar

---

## 10. Para tu rol de formador (cuando lo asumas)

Cuando entrenes a pilotos junior, los puntos clave a enseñar:

1. **Disciplina del estado**: nunca saltarse formularios. Si saltas un A.4, no puedes pasar a `in_flight`.
2. **NOTAM check siempre**: el Espacio OPS es la primera parada antes de cualquier vuelo.
3. **Meteo**: el badge "apto vuelo" es indicativo, no autoritativo. Última palabra siempre del piloto.
4. **Firmas digitales**: tienen valor legal. No firmar si no estás conforme.
5. **PDF dossier**: el operador entrega esto a AESA — la calidad del vuelo se mide por la calidad del dossier.

Para sesiones de formación recomiendo:
- Crear un tenant **demo / sandbox** para que practiquen sin afectar datos reales
- Crear misiones ficticias en estado `draft` para que recorran el ciclo completo
- Repasar dossiers PDF reales (anonimizados) para entender qué se evalúa

---

## 11. Atajos y trucos

- **Mapa**: scroll para zoom, click derecho + arrastrar para girar (3D), botón centrar arriba a la izquierda
- **NOTAM toggle**: botón NOTAM debajo del centrar mapa — oculta/muestra todos los NOTAMs
- **Modo claro de día / oscuro de noche**: el toggle está en el sidebar
- **Tu sesión dura 24h**: se renueva automáticamente con cada acción

---

## 12. Si algo falla

1. Refrescar (Ctrl+R / Cmd+R) — resuelve 80% de los problemas
2. Cerrar sesión y volver a entrar
3. Si persiste: avisa a Luis o JuanCho con captura de pantalla y el código de la misión afectada

**Nunca borres datos manualmente desde la app si no estás seguro** — todo deja rastro en audit log.

---

> Cualquier duda → JuanCho o Luis.
> Cambios en este manual: pídelos por Notion.
