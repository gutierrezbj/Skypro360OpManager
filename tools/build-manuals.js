/**
 * Build Word documents from OpsManager user manuals (v1.1).
 *
 * Genera docs/manuals/manual-piloto.docx + manual-administrador.docx
 *
 * Uso:
 *   node tools/build-manuals.js [outputDir]
 *
 * Default outputDir = ./docs/manuals
 *
 * Requiere: docx instalado globalmente o como dev dep.
 */

const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, BorderStyle, WidthType,
  ShadingType, HeadingLevel, PageBreak, PageNumber,
} = require("docx");

// ── Brand palette ─────────────────────────────────────────────────────────────
const COLOR_BLUE   = "0C9FD8";
const COLOR_ORANGE = "F04E1C";
const COLOR_DARK   = "0D1520";
const COLOR_TEXT   = "1A2433";
const COLOR_MUTED  = "5A7A9A";
const COLOR_BORDER = "CCCCCC";
const COLOR_HEADER_BG = "E8F4FA";

// ── Page setup (A4) ──────────────────────────────────────────────────────────
const PAGE = {
  size: { width: 11906, height: 16838 },
  margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
};

// ── Border helpers ────────────────────────────────────────────────────────────
const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER };
const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

// ── Style helpers ─────────────────────────────────────────────────────────────
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120, line: 300 },
    ...opts,
    children: [new TextRun({ text, font: "Arial", size: 22, color: COLOR_TEXT, ...(opts.run || {}) })],
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: COLOR_BLUE, space: 4 } },
    children: [new TextRun({ text, font: "Arial", size: 32, bold: true, color: COLOR_DARK })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 140 },
    children: [new TextRun({ text, font: "Arial", size: 26, bold: true, color: COLOR_BLUE })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, font: "Arial", size: 22, bold: true, color: COLOR_DARK })],
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text, font: "Arial", size: 22, color: COLOR_TEXT })],
  });
}

function numbered(text) {
  return new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text, font: "Arial", size: 22, color: COLOR_TEXT })],
  });
}

function bulletRich(parts) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 80 },
    children: parts.map((p) => new TextRun({ font: "Arial", size: 22, color: COLOR_TEXT, ...p })),
  });
}

function quote(text) {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    indent: { left: 360 },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color: COLOR_ORANGE, space: 12 } },
    children: [new TextRun({ text, font: "Arial", size: 22, italics: true, color: COLOR_MUTED })],
  });
}

function code(text) {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    shading: { fill: "F4F6F8", type: ShadingType.CLEAR },
    children: [new TextRun({ text, font: "Consolas", size: 20, color: COLOR_DARK })],
  });
}

function divider() {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BLUE, space: 1 } },
    children: [new TextRun({ text: "" })],
  });
}

// ── Tables ────────────────────────────────────────────────────────────────────
function tableCell(text, opts = {}) {
  return new TableCell({
    borders: cellBorders,
    width: { size: opts.width, type: WidthType.DXA },
    shading: opts.shaded ? { fill: COLOR_HEADER_BG, type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      children: [new TextRun({
        text, font: "Arial", size: 20,
        bold: !!opts.bold || !!opts.shaded,
        color: opts.shaded ? COLOR_DARK : COLOR_TEXT,
      })],
    })],
  });
}

function buildTable(headers, rows, columnWidths) {
  const totalWidth = columnWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => tableCell(h, { width: columnWidths[i], shaded: true })),
      }),
      ...rows.map((row) => new TableRow({
        children: row.map((cell, i) => tableCell(cell, { width: columnWidths[i] })),
      })),
    ],
  });
}

// ── Cover block ───────────────────────────────────────────────────────────────
function coverBlock(title, subtitle, version, audience, url) {
  return [
    new Paragraph({
      spacing: { before: 1200, after: 240 },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "OpsManager", font: "Arial", size: 36, bold: true, color: COLOR_BLUE })],
    }),
    new Paragraph({
      spacing: { after: 600 },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Skypro360", font: "Arial", size: 24, color: COLOR_ORANGE, bold: true })],
    }),
    new Paragraph({
      spacing: { after: 120 },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: title, font: "Arial", size: 56, bold: true, color: COLOR_DARK })],
    }),
    new Paragraph({
      spacing: { after: 480 },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: subtitle, font: "Arial", size: 24, color: COLOR_MUTED, italics: true })],
    }),
    new Paragraph({
      spacing: { after: 80 },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `Para: ${audience}`, font: "Arial", size: 22, color: COLOR_TEXT })],
    }),
    new Paragraph({
      spacing: { after: 80 },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `Versión: ${version}`, font: "Arial", size: 22, color: COLOR_TEXT })],
    }),
    new Paragraph({
      spacing: { after: 80 },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: url, font: "Arial", size: 22, color: COLOR_BLUE })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function buildDoc(coverArgs, body) {
  return new Document({
    creator: "Skypro360 OpsManager",
    title: coverArgs.title,
    description: coverArgs.subtitle,
    styles: {
      default: { document: { run: { font: "Arial", size: 22, color: COLOR_TEXT } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 32, bold: true, font: "Arial", color: COLOR_DARK },
          paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 26, bold: true, font: "Arial", color: COLOR_BLUE },
          paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 } },
        { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 22, bold: true, font: "Arial", color: COLOR_DARK },
          paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
      ],
    },
    numbering: {
      config: [
        { reference: "bullets",
          levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
        { reference: "numbers",
          levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      ],
    },
    sections: [{
      properties: { page: PAGE },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: `${coverArgs.title} — OpsManager Skypro360`, font: "Arial", size: 18, color: COLOR_MUTED })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Página ", font: "Arial", size: 18, color: COLOR_MUTED }),
              new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 18, color: COLOR_MUTED }),
              new TextRun({ text: ` · OpsManager v${coverArgs.version.split(" ")[0]} · ${coverArgs.version.split("—")[1]?.trim() ?? ""}`, font: "Arial", size: 18, color: COLOR_MUTED }),
            ],
          })],
        }),
      },
      children: [...coverBlock(coverArgs.title, coverArgs.subtitle, coverArgs.version, coverArgs.audience, coverArgs.url), ...body],
    }],
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// MANUAL DEL PILOTO — Fer (v1.1)
// ═══════════════════════════════════════════════════════════════════════════════
const pilotoBody = [
  // ── Novedades v1.1 ──
  h1("Novedades en v1.1"),
  bulletRich([{ text: "Modo claro/oscuro: ", bold: true }, { text: "el toggle en la esquina inferior izquierda del sidebar cambia ahora también el mapa (claro de día, oscuro de noche)" }]),
  bulletRich([{ text: "Cambio de contraseña obligatorio: ", bold: true }, { text: "en tu primer login el sistema te llevará automáticamente a una pantalla para cambiar la contraseña inicial" }]),
  bulletRich([{ text: "¿Olvidaste la contraseña?: ", bold: true }, { text: "ahora hay un enlace en el login. Te llega un email con un enlace temporal (válido 1 hora) para crear una nueva contraseña" }]),
  bulletRich([{ text: "Vista por rol: ", bold: true }, { text: "como piloto solo verás las misiones que te han asignado. El resto del operador queda fuera" }]),
  bulletRich([{ text: "PDF dossier mejorado: ", bold: true }, { text: "los PDFs de compliance ahora llevan cabecera completa del operador (NIF, registro AESA, CSV)" }]),

  // 1. Login
  h1("1. Tu primer login"),
  numbered("Abre https://skp360mgr.systemrapid.io"),
  numbered("Email: el que te dio Luis o JuanCho"),
  numbered("Contraseña: la inicial que te entregaron"),
  numbered("El sistema te lleva automáticamente a /change-password — debes crear una nueva (mín. 10 caracteres, 1 mayúscula, 1 minúscula, 1 número)"),
  numbered("Después entras al cockpit con tu sesión normal"),
  p("Toda la app es dark cockpit por defecto. Si prefieres claro: esquina inferior izquierda del sidebar, icono sol/luna."),
  quote("Si en algún momento olvidas la contraseña, en el login hay un enlace «¿Olvidaste tu contraseña?». Te llega un email con un enlace para crear una nueva (caduca en 1 hora)."),

  // 2. Navegación
  h1("2. Las 6 zonas del sidebar"),
  buildTable(
    ["Pestaña", "Para qué"],
    [
      ["Operaciones", "Cockpit home — KPIs, misiones activas, historial, alertas"],
      ["Espacio OPS", "Mapa táctico completo — NOTAMs, misiones georreferenciadas"],
      ["Misiones", "Lista o mapa de tus misiones — el sistema solo te muestra las tuyas"],
      ["Flota", "Drones y pilotos del operador con sus certificaciones (solo lectura)"],
      ["Compliance", "Formularios AESA A.4–A.8, firmas, PDF dossier"],
      ["Analytics", "No visible para tu rol (solo admin/coordinador)"],
    ],
    [2400, 7238],
  ),

  // 3. Rutina diaria
  h1("3. Tu rutina diaria — antes de volar"),

  h2("Paso 1: Cockpit (Operaciones)"),
  p("Cuando entras, lo primero que ves:"),
  bulletRich([{ text: "KPIs arriba: ", bold: true }, { text: "cuántas misiones en vuelo, planificadas, drones activos, pilotos válidos" }]),
  bulletRich([{ text: "Misiones activas: ", bold: true }, { text: "tarjetas con código SKY-XXX + drone + piloto asignado" }]),
  bulletRich([{ text: "Panel derecho ", bold: true }, { text: "(lo más importante para ti):" }]),
  bullet("Alertas AESA · BOE — publicaciones oficiales relevantes para UAS"),
  bullet("Alertas vencimiento certificados — si tu médico o licencia caducan pronto, aquí lo ves"),
  bullet("Meteo — selecciona la ciudad o misión activa, te dice si es apto vuelo"),

  h2("Paso 2: Espacio OPS — verifica NOTAMs"),
  p("Antes de cualquier vuelo:"),
  numbered("Click en pestaña Espacio OPS"),
  numbered("Localiza la zona donde vas a volar"),
  numbered("Las áreas azules son NOTAMs activos (678 reales de ENAIRE)"),
  numbered("Click en una zona NOTAM → popup con: ID, altitud (suelo → techo), descripción de la restricción"),
  numbered("Click otra vez para cerrar"),
  quote("Si tu zona de vuelo cae dentro de un NOTAM, no vueles sin autorización específica."),

  h2("Paso 3: Meteo de la zona"),
  bullet("Temperatura mín/máx del día"),
  bullet("Viento: velocidad y dirección"),
  bullet("Precipitación: probabilidad"),
  bullet("Badge Apto vuelo / No apto — basado en límites estándar UAS"),
  p("Fuente: AEMET OpenData (datos oficiales españoles)."),

  // 4. Misiones (RBAC pilot)
  h1("4. Tus misiones"),
  p("En la pestaña Misiones solo verás las que el coordinador o el administrador te ha asignado. Las del resto del operador no aparecen."),
  h3("Lo que SÍ puedes hacer en tus misiones:"),
  bullet("Verlas en lista o mapa"),
  bullet("Cambiar el estado de tu misión (preflight → in_flight → completed)"),
  bullet("Firmar los formularios A.4 a A.8"),
  bullet("Generar el PDF dossier final"),
  h3("Lo que NO puedes hacer:"),
  bullet("Crear misiones nuevas (las crea Luis o el coordinador)"),
  bullet("Borrar misiones (solo admin)"),
  bullet("Editar campos básicos como nombre, drone, fechas (solo coordinador+)"),
  quote("Si necesitas crear una misión nueva o cambiar drone/piloto, dile a Luis (admin) o al coordinador."),

  // 5. Estados
  h1("5. Estados de misión"),
  code("draft → planned → approved → preflight → in_flight → completed"),
  code("                                           ↓"),
  code("                                        aborted / cancelled"),
  buildTable(
    ["Estado", "Quién y cuándo"],
    [
      ["draft", "Recién creada por coordinador, editable libremente"],
      ["planned", "Listada, falta aprobación operativa"],
      ["approved", "Lista para volar — te llega email"],
      ["preflight", "Pasas tú: rellenas A.4 + checklist pre-vuelo + firmas"],
      ["in_flight", "Pasas tú: drone en el aire — te llega email a Luis"],
      ["completed", "Pasas tú: firmas A.7 post-flight, mision cerrada"],
      ["aborted", "Misión cortada en vuelo — incidente A.8 obligatorio"],
      ["cancelled", "No se ejecutó (motivo libre, lo hace coordinador)"],
    ],
    [2400, 7238],
  ),
  quote("Cada cambio de estado importante te dispara un email a ti y a Luis (administrador)."),

  // 6. Compliance AESA
  h1("6. Compliance AESA — formularios A.4 a A.8"),
  p("Pestaña Compliance o desde dentro de la misión → botón Compliance."),

  h2("A.4 — Planificación operacional (pre-vuelo)"),
  bullet("Análisis de zona, riesgos, espacios aéreos"),
  bullet("Firma digital del piloto (pad táctil en pantalla)"),
  bullet("Bloquea el paso a preflight"),

  h2("A.5 — Pre-flight checklist"),
  bullet("Estado del drone (batería, integridad, cámaras)"),
  bullet("Comprobación radioenlace"),
  bullet("Firma piloto"),

  h2("A.6 — Briefing equipo"),
  bullet("Si hay observador o copiloto: roles + comunicaciones acordadas"),

  h2("A.7 — Post-flight log"),
  bullet("Horas voladas + incidencias menores"),
  bullet("Estado final del drone"),

  h2("A.8 — Reporte de incidente"),
  bullet("Solo si el vuelo se aborta o hay incidente"),
  bullet("Detalles, evidencias, acción correctiva"),

  // 7. PDF dossier
  h1("7. PDF dossier — el entregable AESA"),
  p("Una vez completados los formularios:"),
  p("Compliance → botón Generar dossier PDF"),
  h3("Sale un PDF único con (v1.1):"),
  bullet("Cabecera AESA: nombre, NIF, registro operador, CSV verificación"),
  bullet("Datos de la misión (código, fechas, ubicación, drone, piloto)"),
  bullet("A.4 + firma piloto"),
  bullet("A.5 + firma piloto"),
  bullet("A.6 (si aplica)"),
  bullet("A.7 + horas voladas"),
  bullet("A.8 (si aplica)"),
  bullet("Footer en cada página con código + registro AESA"),

  // 8. Tu zona personal
  h1("8. Tu zona personal — Flota"),
  p("Pestaña Flota → Pilotos → tu ficha. Solo lectura para ti. Si necesitas actualizar fechas (renovaste licencia, médico), avisa a Luis."),
  bullet("Licencia (número y vencimiento)"),
  bullet("Certificado médico (vencimiento)"),
  bullet("Habilitaciones (A1/A3, A2, STS, específica)"),
  bullet("Horas de vuelo acumuladas (suma automática de cada A.7)"),

  // 9. Atajos
  h1("9. Atajos y trucos"),
  bulletRich([{ text: "Mapa: ", bold: true }, { text: "scroll para zoom, click derecho + arrastrar para girar (3D), botón centrar arriba a la izquierda" }]),
  bulletRich([{ text: "NOTAM toggle: ", bold: true }, { text: "botón NOTAM debajo del centrar mapa — oculta/muestra todos los NOTAMs" }]),
  bulletRich([{ text: "Cambio tema: ", bold: true }, { text: "icono sol/luna en sidebar. Cambia toda la UI Y el mapa" }]),
  bulletRich([{ text: "Cambiar contraseña: ", bold: true }, { text: "icono engranaje en sidebar (al lado del toggle tema)" }]),
  bulletRich([{ text: "Tu sesión dura 24h: ", bold: true }, { text: "se renueva con cada acción" }]),

  // 10. Soporte
  h1("10. Si algo falla"),
  numbered("Refrescar (Ctrl+R / Cmd+R) — resuelve 80% de los problemas"),
  numbered("Cerrar sesión y volver a entrar"),
  numbered("Si olvidaste la contraseña → enlace en el login → email reset"),
  numbered("Si persiste: avisa a Luis o JuanCho con captura y código de la misión"),
  quote("Nunca borres datos manualmente desde la app. Todo deja rastro en audit log."),

  divider(),
  p("Cualquier duda → Luis (administrador) o JuanCho.", { run: { italics: true, color: COLOR_MUTED, size: 20 } }),
];

// ═══════════════════════════════════════════════════════════════════════════════
// MANUAL DEL ADMINISTRADOR — Luis (v1.1)
// ═══════════════════════════════════════════════════════════════════════════════
const adminBody = [
  // ── Novedades v1.1 ──
  h1("Novedades en v1.1"),
  bulletRich([{ text: "Tu rol es ahora org_admin: ", bold: true }, { text: "antes estabas como pilot, lo cual te bloqueaba la gestión de flota. Ya está corregido" }]),
  bulletRich([{ text: "Cambio de contraseña obligatorio: ", bold: true }, { text: "cuando crees usuarios nuevos, marca must_change_password=true para forzar cambio en su primer login" }]),
  bulletRich([{ text: "Reset password por email: ", bold: true }, { text: "los usuarios pueden auto-resetear desde el login sin pedirte ayuda. Sigue habiendo enlace para que tú lo gestiones si lo prefieres" }]),
  bulletRich([{ text: "RBAC enforced: ", bold: true }, { text: "los pilotos ya solo ven sus misiones. Los coordinadores ven todas. Tú ves todo" }]),
  bulletRich([{ text: "Backup automático Postgres: ", bold: true }, { text: "diario a las 03:15 UTC. Conservación 14 días + 4 semanas + 6 meses en /opt/apps/opsmanager/backups/" }]),
  bulletRich([{ text: "Datos AESA del operador: ", bold: true }, { text: "ya almacenados (NIF, registro, CSV). Aparecen en la cabecera del PDF dossier" }]),
  bulletRich([{ text: "Modo claro en mapa: ", bold: true }, { text: "el mapa cambia entre Positron (claro) y Dark Matter (oscuro) según tu tema" }]),

  // 1. Tu rol
  h1("1. Tu rol"),
  p("Eres el org_admin del tenant Skypro360. No vuelas, pero todo lo que pasa en la plataforma pasa por ti:"),
  bullet("Alta y baja de pilotos y drones"),
  bullet("Renovación de certificaciones"),
  bullet("Supervisión de operación (qué se está volando, dónde, cuándo)"),
  bullet("Compliance global"),
  bullet("Reporte a AESA cuando aplique"),
  bullet("Soporte primer nivel a los pilotos"),
  quote("Tu visión es panorámica. Los pilotos solo ven sus misiones; tú ves todo."),

  // 2. Acceso
  h1("2. Acceso y navegación"),
  numbered("https://skp360mgr.systemrapid.io"),
  numbered("Tus credenciales — guárdalas en gestor de contraseñas"),
  numbered("Toggle modo claro/oscuro: sidebar inferior izquierdo (cambia toda la UI Y el mapa)"),
  numbered("Cambiar contraseña: icono engranaje en sidebar"),
  p("Las 6 zonas del sidebar (todas accesibles para ti):"),
  buildTable(
    ["Pestaña", "Tu uso principal"],
    [
      ["Operaciones", "Cockpit — visión general operativa diaria"],
      ["Espacio OPS", "Mapa táctico — visualizar dónde están operando"],
      ["Misiones", "Auditoría de misiones, cambios de estado"],
      ["Flota", "Tu zona — alta/baja drones y pilotos"],
      ["Compliance", "Tu otra zona — vencimientos, AESA, dossiers"],
      ["Analytics", "KPIs operación, horas, métricas"],
    ],
    [2400, 7238],
  ),

  // 3. Cockpit
  h1("3. Cockpit — tu radar diario"),
  p("Vistazo en 30 segundos:"),
  bulletRich([{ text: "KPIs: ", bold: true }, { text: "en vuelo / planificadas / drones activos / pilotos válidos" }]),
  bulletRich([{ text: "Misiones activas: ", bold: true }, { text: "qué se está ejecutando ahora mismo" }]),
  bulletRich([{ text: "Panel derecho — Alertas AESA · BOE: ", bold: true }, { text: "publicaciones oficiales BOE relevantes UAS/RPAS" }]),
  bullet("Naranja = directo sobre drones (regulación, sanciones)"),
  bullet("Amarillo = relacionado (espacios aéreos, transporte)"),
  bullet("Gris = general"),
  quote("Tu trabajo aquí: revisar alertas BOE 1 vez al día. Si sale algo crítico, avisar al equipo."),

  // 4. Flota
  h1("4. Gestión de flota"),

  h2("4.1 Alta de un drone nuevo"),
  p("Flota → Drones → botón Nuevo drone"),
  bulletRich([{ text: "Modelo, S/N, fabricante", bold: true }, { text: " — obligatorios" }]),
  bulletRich([{ text: "Matrícula AESA: ", bold: true }, { text: "formato ES.UAS.YYYY.NNNN si la tienes" }]),
  bulletRich([{ text: "Clase EASA: ", bold: true }, { text: "C0 / C1 / C2 / C3 / C4 / C5 / C6" }]),
  bulletRich([{ text: "MTOM, seguro, fechas", bold: true }, { text: " — opcionales pero importantes para compliance" }]),

  h2("4.2 Cambio de estado de drone"),
  bullet("active → operativo y disponible para misiones"),
  bullet("maintenance → en taller, bloqueado para asignación"),
  bullet("retired → baja definitiva"),
  bullet("pending_registration → registro AESA en trámite"),

  h2("4.3 Alta de un piloto nuevo"),
  p("Workflow correcto:"),
  numbered("Pides a JuanCho que cree el usuario (vía consola servidor) con role=pilot y must_change_password=true"),
  numbered("JuanCho te pasa la contraseña inicial"),
  numbered("Tú la pasas al piloto por canal seguro (WhatsApp privado)"),
  numbered("Tú creas su ficha en Flota → Pilotos vinculando ese usuario"),
  numbered("Le metes licencia, certificado, habilitaciones"),
  numbered("El piloto entra → cambia contraseña → opera"),

  h2("4.4 Cuando un piloto te trae certificados nuevos"),
  numbered("Recibes documentos escaneados o físicos"),
  numbered("Verificas autenticidad"),
  numbered("Editas su ficha en Flota → Pilotos"),
  numbered("Actualizas fecha vencimiento + número si cambió"),
  numbered("Confirmas que el estado vuelve a valid"),

  // 5. Compliance
  h1("5. Compliance"),
  p("Pestaña Compliance:"),
  bullet("Estado global de misiones (dossier completo vs incompleto)"),
  bullet("Vencimientos próximos (mismas alertas del cockpit)"),
  bullet("Templates AESA"),
  h3("PDF dossier (v1.1) lleva en la cabecera:"),
  bullet("Nombre del operador (Skypro360)"),
  bullet("Razón social (Juan Ramon Gutierrez Blanco)"),
  bullet("NIF (51725158K)"),
  bullet("Registro operador AESA (2024/LPAIO/000744)"),
  bullet("CSV verificación"),
  bullet("Email contacto"),
  quote("Si alguno de estos campos cambia, avisa a JuanCho. Están en la tabla tenants y los puedo actualizar por SQL en producción."),

  // 6. Misiones
  h1("6. Misiones — supervisión"),
  bullet("Lista filtrable por estado, prioridad, piloto, drone"),
  bullet("Vista mapa: toggle Lista | Mapa en cabecera"),
  bullet("Como org_admin ves TODAS las misiones del operador"),
  bullet("Solo intervienes en estados para cancelar (cliente pospone) o aprobar"),

  // 7. Usuarios
  h1("7. Gestión de usuarios"),
  quote("v1.1 stage 1: solo JuanCho crea usuarios desde consola. Cuando lleguemos a Stage 3 (OAuth), tú podrás crear desde la UI."),
  h3("Roles:"),
  bulletRich([{ text: "admin", bold: true }, { text: " — solo SRS / JuanCho" }]),
  bulletRich([{ text: "org_admin", bold: true }, { text: " — tú" }]),
  bulletRich([{ text: "pilot", bold: true }, { text: " — Fer y resto" }]),
  bulletRich([{ text: "coordinator", bold: true }, { text: " — coordinador operativo" }]),
  bulletRich([{ text: "viewer", bold: true }, { text: " — solo lectura, ej cliente externo" }]),

  h3("Reset de contraseña — opciones"),
  numbered("Self-service: el usuario va a /forgot-password, mete su email, le llega enlace temporal (1h)"),
  numbered("Si el usuario no recibe el email, revisa que esté bien escrito en su ficha"),
  numbered("Si necesitas resetear forzado: pide a JuanCho que ponga must_change_password=true en su user. Próximo login le obliga a cambiar"),

  // 8. Analytics
  h1("8. Analytics — visión comercial"),
  bullet("Total misiones por mes"),
  bullet("Distribución por estado (completadas vs abortadas)"),
  bullet("Horas vuelo total por piloto"),
  bullet("Drone más utilizado"),
  bullet("Útil para reportes mensuales internos y dimensionar plantilla"),

  // 9. Backups
  h1("9. Backups y restauración"),
  p("Sistema automático corriendo en VPS. No necesitas hacer nada en el día a día."),
  h3("Configuración:"),
  bullet("Cron: 03:15 UTC todos los días"),
  bullet("Ubicación: /opt/apps/opsmanager/backups/"),
  bullet("Diarios: 14 más recientes (carpeta daily/)"),
  bullet("Semanales: 4 (cada domingo, weekly/)"),
  bullet("Mensuales: 6 (día 1 de cada mes, monthly/)"),
  bullet("Tamaño actual: ~84 KB comprimido por backup (crece con uso)"),

  h3("Si necesitas restaurar:"),
  numbered("Avisa a JuanCho — no lo hagas tú directamente (es operación destructiva)"),
  numbered("JuanCho ejecuta /opt/apps/opsmanager/ops/restore-postgres.sh <archivo>"),
  numbered("El script crea un safety backup pre-operación por si hay que revertir"),

  // 10. Rutina semanal
  h1("10. Tu rutina semanal recomendada"),
  buildTable(
    ["Día", "Tarea"],
    [
      ["Lunes", "Revisar alertas vencimiento del cockpit. Cualquiera < 30 días → avisar piloto"],
      ["Lunes", "Revisar BOE de la semana anterior — ¿hay novedades regulatorias?"],
      ["Diario", "Vistazo al cockpit (1 minuto) — ¿hay misiones in_flight? ¿alertas nuevas?"],
      ["Final de mes", "Generar PDFs dossier de todas las misiones completadas"],
      ["Final de mes", "Sacar Analytics → reporte mensual a Skypro360"],
      ["Trimestral", "Revisar caducidades a 90 días vista — anticipar renovaciones"],
    ],
    [2400, 7238],
  ),

  // 11. Soporte
  h1("11. Soporte — qué hacer cuando un piloto te llama"),

  h2("Caso 1: \"No puedo pasar mi misión a in_flight\""),
  bullet("Verifica: ¿drone asignado? ¿piloto asignado? ¿A.4 firmado?"),
  bullet("Si falta algo → dile qué falta y deja que él lo arregle"),

  h2("Caso 2: \"Mi certificado caducó pero ya lo renové\""),
  bullet("Pide foto del nuevo certificado"),
  bullet("Edita su ficha → cambias fecha vencimiento"),
  bullet("Si estado quedó expired, lo pasas a valid"),

  h2("Caso 3: \"Olvidé mi contraseña\""),
  bullet("Dile que use el enlace «¿Olvidaste tu contraseña?» en el login"),
  bullet("Le llega email con enlace temporal (1h)"),
  bullet("Si no le llega, revisa email en su ficha"),

  h2("Caso 4: \"No me deja crear una misión\""),
  bullet("Como pilot no puede crear misiones (solo coordinator/admin)"),
  bullet("Crea tú la misión y asígnala a él"),

  h2("Caso 5: \"El PDF dossier sale incompleto\""),
  bullet("Verifica que todos los formularios A.4–A.8 que apliquen están firmados"),
  bullet("Si una sección falta → captura + JuanCho"),

  // 12. Reglas oro
  h1("12. Reglas de oro"),
  numbered("Nunca borres datos manualmente — todo deja audit log"),
  numbered("Las firmas digitales son legales — trata el sistema con seriedad notarial"),
  numbered("No compartas credenciales — cada usuario su login"),
  numbered("Los dossiers PDF son entregables AESA — guárdalos con la misma seriedad que un contrato"),
  numbered("Las alertas BOE son tu sistema de aviso temprano — un cambio regulatorio ignorado puede costar caro"),

  // 13. Roadmap
  h1("13. Roadmap — lo que viene"),
  buildTable(
    ["Próximamente", "Qué te aporta"],
    [
      ["Telemetría real-time", "Posición del drone en vivo en el mapa"],
      ["PWA offline-first", "Pilotos firman A.5/A.7 sin conexión en campo"],
      ["Notificaciones push", "Avisos en móvil sin tener abierta la app"],
      ["Plantillas de misión", "Clonar misiones recurrentes (inspecciones semanales)"],
      ["Adjuntar archivos", "Foto pre-vuelo, KMZ del cliente, mapa de zona"],
      ["Subdominios por tenant", "skypro360.opsmanager.es cuando crezcamos"],
    ],
    [3000, 6638],
  ),

  divider(),
  p("Cualquier duda crítica → JuanCho directamente.", { run: { italics: true, color: COLOR_MUTED, size: 20 } }),
  p("Cualquier mejora que quieras → la pides en Notion y entra en backlog.", { run: { italics: true, color: COLOR_MUTED, size: 20 } }),
  p("Esto es tu plataforma, hazla tuya.", { run: { italics: true, color: COLOR_MUTED, size: 20 } }),
];

// ── Build & save ─────────────────────────────────────────────────────────────
const outDir = process.argv[2] || path.join(__dirname, "..", "docs", "manuals");
fs.mkdirSync(outDir, { recursive: true });

const VERSION = "1.1 — 2026-05-02";

const pilotoDoc = buildDoc({
  title: "Manual del Piloto",
  subtitle: "Operación de drones, compliance AESA y formación",
  version: VERSION,
  audience: "Fer (piloto senior + futuro formador)",
  url: "https://skp360mgr.systemrapid.io",
}, pilotoBody);

const adminDoc = buildDoc({
  title: "Manual del Administrador",
  subtitle: "Gestión de plataforma, flota y compliance global",
  version: VERSION,
  audience: "Luis (org_admin Skypro360)",
  url: "https://skp360mgr.systemrapid.io",
}, adminBody);

(async () => {
  const pilotoBuf = await Packer.toBuffer(pilotoDoc);
  const pilotoPath = path.join(outDir, "manual-piloto.docx");
  fs.writeFileSync(pilotoPath, pilotoBuf);
  console.log(`✓ ${pilotoPath} (${(pilotoBuf.length / 1024).toFixed(1)} KB)`);

  const adminBuf = await Packer.toBuffer(adminDoc);
  const adminPath = path.join(outDir, "manual-administrador.docx");
  fs.writeFileSync(adminPath, adminBuf);
  console.log(`✓ ${adminPath} (${(adminBuf.length / 1024).toFixed(1)} KB)`);
})();
