-- Sprint 4: añadir 'none' al enum incident_type para declaración formal "sin incidentes"
ALTER TYPE incident_type ADD VALUE IF NOT EXISTS 'none' BEFORE 'flyaway';
