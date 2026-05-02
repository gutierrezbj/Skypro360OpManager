import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { tenants } from "./schema/tenants";
import { users } from "./schema/users";
import { drones } from "./schema/fleet";
import { pilots } from "./schema/fleet";
import { missions } from "./schema/missions";
import bcrypt from "bcryptjs";

/**
 * Seed script — crea tenant, users, drones y pilotos con datos reales.
 * Run: npm run db:seed
 */
async function seed() {
  const connectionString = process.env.DATABASE_URL
    ?? "postgresql://opsmanager:opsmanager@localhost:6100/opsmanager";

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  console.log("Seeding OpsManager database...");

  // 1. Tenant Skypro360
  const [tenant] = await db
    .insert(tenants)
    .values({
      name: "Skypro360",
      slug: "skypro360",
    })
    .onConflictDoNothing({ target: tenants.slug })
    .returning();

  const tenantId = tenant?.id;
  if (!tenantId) {
    console.log("Tenant skypro360 already exists, skipping...");
    await client.end();
    return;
  }

  console.log(`Created tenant: ${tenant.name} (${tenantId})`);

  // 2. Admin user
  const passwordHash = await bcrypt.hash("admin12345", 12);
  const [admin] = await db
    .insert(users)
    .values({
      tenantId,
      email: "admin@skypro360.es",
      name: "Admin Skypro360",
      passwordHash,
      role: "admin",
    })
    .returning();

  console.log(`Created admin user: ${admin.email}`);

  // 3. Coordinator
  const coordHash = await bcrypt.hash("coord12345", 12);
  const [coord] = await db
    .insert(users)
    .values({
      tenantId,
      email: "coordinador@skypro360.es",
      name: "Coordinador Ops",
      passwordHash: coordHash,
      role: "coordinator",
    })
    .returning();

  console.log(`Created coordinator: ${coord.email}`);

  // 4. Operational users — Luis es org_admin (no piloto), Ferenz es piloto senior
  const opHash = await bcrypt.hash("pilot12345", 12);
  const pilotUsers: { id: string; name: string; email: string }[] = [];
  for (const p of [
    { name: "Luis Duran",   email: "luis@skypro360.es",   role: "org_admin" as const },
    { name: "Ferenz Stefan", email: "ferenz@skypro360.es", role: "pilot"     as const },
  ]) {
    const [user] = await db
      .insert(users)
      .values({
        tenantId,
        email: p.email,
        name: p.name,
        passwordHash: opHash,
        role: p.role,
      })
      .returning();
    pilotUsers.push({ id: user.id, name: user.name, email: user.email });
    console.log(`Created ${p.role}: ${user.email}`);
  }

  // 5. Drones — flota real Skypro360
  const droneData = [
    {
      serialNumber: "1ZNBJ5M0030ERM",
      model: "Mavic 3 Enterprise",
      manufacturer: "DJI",
      registrationNumber: "ES.UAS.2024.0341",
      status: "active" as const,
      category: "specific",
      easaClass: "C1",
      mtomKg: "0.92",
      maxFlightTime: 46,
      maxPayload: "0.10",
      insuranceExpiry: new Date("2027-03-15"),
    },
    {
      serialNumber: "1ZNBJ8K002A7P8",
      model: "Matrice 350 RTK",
      manufacturer: "DJI",
      registrationNumber: "ES.UAS.2024.0342",
      status: "active" as const,
      category: "specific",
      easaClass: "C2",
      mtomKg: "6.30",
      maxFlightTime: 55,
      maxPayload: "2.73",
      insuranceExpiry: new Date("2027-03-15"),
    },
    {
      serialNumber: "1ZNBJ4R0010FTG",
      model: "Mini 4 Pro",
      manufacturer: "DJI",
      registrationNumber: "ES.UAS.2025.0012",
      status: "active" as const,
      category: "open",
      easaClass: "C0",
      mtomKg: "0.25",
      maxFlightTime: 34,
      maxPayload: "0.00",
      insuranceExpiry: new Date("2027-06-01"),
    },
    {
      serialNumber: "5YNAH220030KRZ",
      model: "Agras T40",
      manufacturer: "DJI",
      registrationNumber: null,
      status: "pending_registration" as const,
      category: "certified",
      easaClass: "C6",
      mtomKg: "52.00",
      maxFlightTime: 18,
      maxPayload: "40.00",
      insuranceExpiry: null,
    },
    {
      serialNumber: "1ZNBJ3E001B2RM",
      model: "Mavic 2 Pro",
      manufacturer: "DJI",
      registrationNumber: "ES.UAS.2023.0189",
      status: "maintenance" as const,
      category: "open",
      easaClass: "C1",
      mtomKg: "0.91",
      maxFlightTime: 31,
      maxPayload: "0.00",
      insuranceExpiry: new Date("2026-12-01"),
    },
  ];

  for (const d of droneData) {
    await db.insert(drones).values({ tenantId, ...d });
    console.log(`Created drone: ${d.model} (${d.serialNumber})`);
  }

  // 6. Pilotos — solo Ferenz (Luis es admin, no piloto)
  const pilotRecords = [
    {
      userId: pilotUsers[1].id, // Ferenz (pilotUsers[0] es Luis = org_admin, no se registra como piloto)
      licenseNumber: "ESP-UAS-PIL-2024-1204",
      certificationStatus: "valid" as const,
      certificationExpiry: new Date("2027-09-20"),
      medicalExpiry: new Date("2026-11-30"),
      flightHours: "128.0",
      notes: "A1/A3 aprobado. Formacion A2 en curso.",
    },
  ];

  for (const p of pilotRecords) {
    await db.insert(pilots).values({ tenantId, ...p });
    console.log(`Created pilot record for userId: ${p.userId}`);
  }

  // 7. Missions — 12 misiones en diferentes estados
  // Need drone and pilot IDs from DB
  const allDrones = await db.select().from(drones);
  const allPilots = await db.select().from(pilots);

  const mavic3 = allDrones.find((d) => d.model === "Mavic 3 Enterprise");
  const matrice = allDrones.find((d) => d.model === "Matrice 350 RTK");
  const mini4 = allDrones.find((d) => d.model === "Mini 4 Pro");
  const luisPilot = allPilots.find((p) => p.userId === pilotUsers[0].id);
  const ferenzPilot = allPilots.find((p) => p.userId === pilotUsers[1].id);

  const missionData = [
    {
      code: "SKY-2026-001",
      name: "Inspeccion parque solar Valdecaballeros",
      description: "Vuelo termografico sobre planta fotovoltaica 50MW para deteccion de hotspots.",
      status: "completed" as const,
      priority: "high" as const,
      pilotId: luisPilot?.id,
      droneId: mavic3?.id,
      coordinatorId: coord.id,
      scheduledStart: new Date("2026-03-10T09:00:00Z"),
      scheduledEnd: new Date("2026-03-10T12:00:00Z"),
      actualStart: new Date("2026-03-10T09:15:00Z"),
      actualEnd: new Date("2026-03-10T11:45:00Z"),
      soraClass: "SAIL II",
      maxAltitude: "120.0",
      latitude: "39.2286",
      longitude: "-5.1675",
    },
    {
      code: "SKY-2026-002",
      name: "Topografia obra A-66 tramo 3",
      description: "Levantamiento fotogrametrico para cubicaje de movimiento de tierras.",
      status: "completed" as const,
      priority: "normal" as const,
      pilotId: ferenzPilot?.id,
      droneId: matrice?.id,
      coordinatorId: coord.id,
      scheduledStart: new Date("2026-03-12T08:00:00Z"),
      scheduledEnd: new Date("2026-03-12T13:00:00Z"),
      actualStart: new Date("2026-03-12T08:20:00Z"),
      actualEnd: new Date("2026-03-12T12:30:00Z"),
      soraClass: "SAIL II",
      maxAltitude: "100.0",
      latitude: "38.4520",
      longitude: "-6.1890",
    },
    {
      code: "SKY-2026-003",
      name: "Revision linea electrica Badajoz-Merida",
      description: "Inspeccion visual y termica de 15km de linea de alta tension.",
      status: "in_flight" as const,
      priority: "urgent" as const,
      pilotId: luisPilot?.id,
      droneId: mavic3?.id,
      coordinatorId: coord.id,
      scheduledStart: new Date("2026-03-28T07:30:00Z"),
      scheduledEnd: new Date("2026-03-28T14:00:00Z"),
      actualStart: new Date("2026-03-28T07:45:00Z"),
      soraClass: "SAIL III",
      maxAltitude: "90.0",
      earoReference: "EARO-EXT-2026-0089",
      latitude: "38.8794",
      longitude: "-6.3422",
    },
    {
      code: "SKY-2026-004",
      name: "Cartografia finca La Dehesa",
      description: "Ortofoto y MDT de explotacion agroganadera 200ha.",
      status: "preflight" as const,
      priority: "normal" as const,
      pilotId: ferenzPilot?.id,
      droneId: matrice?.id,
      coordinatorId: coord.id,
      scheduledStart: new Date("2026-03-29T09:00:00Z"),
      scheduledEnd: new Date("2026-03-29T15:00:00Z"),
      soraClass: "SAIL II",
      maxAltitude: "120.0",
      latitude: "39.0912",
      longitude: "-6.5134",
    },
    {
      code: "SKY-2026-005",
      name: "Inspeccion puente romano Alcantara",
      description: "Modelado 3D de estructura para patrimonio cultural.",
      status: "approved" as const,
      priority: "high" as const,
      pilotId: luisPilot?.id,
      droneId: mavic3?.id,
      scheduledStart: new Date("2026-03-31T08:00:00Z"),
      scheduledEnd: new Date("2026-03-31T11:00:00Z"),
      soraClass: "SAIL II",
      maxAltitude: "60.0",
      earoReference: "EARO-EXT-2026-0102",
      latitude: "39.7186",
      longitude: "-6.8892",
    },
    {
      code: "SKY-2026-006",
      name: "Vigilancia forestal Sierra de Gata",
      description: "Patrulla aerea preventiva epoca de incendios.",
      status: "planned" as const,
      priority: "high" as const,
      pilotId: ferenzPilot?.id,
      droneId: mini4?.id,
      scheduledStart: new Date("2026-04-05T06:00:00Z"),
      scheduledEnd: new Date("2026-04-05T10:00:00Z"),
      soraClass: "SAIL I",
      maxAltitude: "120.0",
      latitude: "40.2254",
      longitude: "-6.7692",
    },
    {
      code: "SKY-2026-007",
      name: "Inspeccion torre telecomunicaciones Caceres",
      description: "Revision estado antenas y estructura metalica.",
      status: "planned" as const,
      priority: "normal" as const,
      droneId: mavic3?.id,
      scheduledStart: new Date("2026-04-08T10:00:00Z"),
      scheduledEnd: new Date("2026-04-08T12:00:00Z"),
      soraClass: "SAIL I",
      maxAltitude: "80.0",
      latitude: "39.4753",
      longitude: "-6.3724",
    },
    {
      code: "SKY-2026-008",
      name: "Seguimiento obra urbanizacion Los Montitos",
      description: "Vuelo mensual de seguimiento de obra civil.",
      status: "draft" as const,
      priority: "low" as const,
      scheduledStart: new Date("2026-04-15T09:00:00Z"),
      scheduledEnd: new Date("2026-04-15T11:00:00Z"),
      maxAltitude: "100.0",
      latitude: "38.8950",
      longitude: "-6.9730",
    },
    {
      code: "SKY-2026-009",
      name: "Ortofoto parcela catastral 45-Merida",
      description: "Vuelo para delimitacion catastral con precision centimetrica.",
      status: "draft" as const,
      priority: "normal" as const,
      droneId: matrice?.id,
      maxAltitude: "80.0",
      latitude: "38.9160",
      longitude: "-6.3438",
    },
    {
      code: "SKY-2026-010",
      name: "Demo corporativa Iberdrola",
      description: "Vuelo demostrativo para potencial cliente sector energia.",
      status: "draft" as const,
      priority: "normal" as const,
      latitude: "38.9010",
      longitude: "-6.8548",
    },
    {
      code: "SKY-2026-011",
      name: "Inspeccion presa Canchales",
      description: "Vuelo cancelado por condiciones meteorologicas adversas.",
      status: "cancelled" as const,
      priority: "high" as const,
      pilotId: luisPilot?.id,
      droneId: matrice?.id,
      scheduledStart: new Date("2026-03-20T08:00:00Z"),
      scheduledEnd: new Date("2026-03-20T12:00:00Z"),
      soraClass: "SAIL III",
      maxAltitude: "50.0",
      latitude: "38.9490",
      longitude: "-6.1524",
    },
    {
      code: "SKY-2026-012",
      name: "Vuelo nocturno pruebas sensor LIDAR",
      description: "Mision abortada por fallo GPS en drone.",
      status: "aborted" as const,
      priority: "normal" as const,
      pilotId: ferenzPilot?.id,
      droneId: matrice?.id,
      scheduledStart: new Date("2026-03-18T22:00:00Z"),
      scheduledEnd: new Date("2026-03-19T01:00:00Z"),
      actualStart: new Date("2026-03-18T22:10:00Z"),
      actualEnd: new Date("2026-03-18T22:25:00Z"),
      soraClass: "SAIL IV",
      maxAltitude: "120.0",
      latitude: "39.4700",
      longitude: "-6.3800",
    },
  ];

  for (const m of missionData) {
    await db.insert(missions).values({ tenantId, ...m });
    console.log(`Created mission: ${m.code} — ${m.name} [${m.status}]`);
  }

  console.log("\nSeed complete!");
  console.log("  Login: admin@skypro360.es / admin12345");
  console.log("  Pilotos: luis@skypro360.es, ferenz@skypro360.es / pilot12345");
  console.log("  Misiones: 12 en varios estados");
  await client.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
