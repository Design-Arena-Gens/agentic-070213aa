'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import { schemaStatements } from '@/lib/database/schema';
import { seedDatabase } from '@/lib/database/seed';
import type {
  Notification,
  Phase,
  PhaseStatus,
  Project,
  ProjectStatus,
  ProjectWithRelations,
  Resource
} from '@/lib/types';

type ProjectPayload = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;
type PhasePayload = Omit<Phase, 'id' | 'projectId'>;
type ResourcePayload = Omit<Resource, 'id' | 'projectId'>;

type DatabaseContextValue = {
  ready: boolean;
  projects: ProjectWithRelations[];
  notifications: Notification[];
  refresh: () => void;
  addProject: (payload: ProjectPayload) => string;
  updateProject: (id: string, payload: Partial<ProjectPayload>) => void;
  deleteProject: (id: string) => void;
  addPhase: (projectId: string, payload: PhasePayload) => string;
  updatePhase: (id: string, payload: Partial<PhasePayload>) => void;
  deletePhase: (id: string) => void;
  addResource: (projectId: string, payload: ResourcePayload) => string;
  updateResource: (id: string, payload: Partial<ResourcePayload>) => void;
  deleteResource: (id: string) => void;
  markNotificationRead: (id: string) => void;
};

const DatabaseContext = createContext<DatabaseContextValue | undefined>(undefined);

const STORAGE_KEY = 'agentic-sqlite-db';

const locateFile = (file: string) => `https://sql.js.org/dist/${file}`;

function uint8ArrayToBase64(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.length;
  for (let i = 0; i < len; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function mapProjectRow(row: any): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    status: row.status as ProjectStatus,
    startDate: row.start_date,
    endDate: row.end_date,
    budget: Number(row.budget) ?? 0,
    spent: Number(row.spent) ?? 0,
    health: (row.health ?? 'stable') as Project['health'],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapPhaseRow(row: any): Phase {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
    progress: Number(row.progress),
    status: row.status as PhaseStatus
  };
}

function mapResourceRow(row: any): Resource {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    type: row.type,
    allocation: Number(row.allocation)
  };
}

function mapNotificationRow(row: any): Notification {
  return {
    id: row.id,
    projectId: row.project_id ?? null,
    message: row.message,
    severity: row.severity,
    createdAt: row.created_at,
    isRead: Boolean(row.is_read)
  };
}

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [SQL, setSQL] = useState<SqlJsStatic | null>(null);
  const [db, setDb] = useState<Database | null>(null);
  const [ready, setReady] = useState(false);
  const [projects, setProjects] = useState<ProjectWithRelations[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const sql = await initSqlJs({ locateFile });
      if (cancelled) return;
      setSQL(sql);

      let database: Database;
      const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (stored) {
        const bytes = base64ToUint8Array(stored);
        database = new sql.Database(bytes);
      } else {
        database = new sql.Database();
        schemaStatements.forEach((statement) => database.run(statement));
        seedDatabase(database);
      }

      if (cancelled) {
        database.close();
        return;
      }

      setDb(database);
      setReady(true);
    }
    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(
    (database: Database) => {
      if (typeof window === 'undefined') {
        return;
      }
      const data = database.export();
      const base64 = uint8ArrayToBase64(data);
      localStorage.setItem(STORAGE_KEY, base64);
    },
    []
  );

  const selectAll = useCallback(
    <T,>(statement: string, params: any[] = []): T[] => {
      if (!db) return [];
      const results: T[] = [];
      const stmt = db.prepare(statement, params);
      while (stmt.step()) {
        results.push(stmt.getAsObject() as T);
      }
      stmt.free();
      return results;
    },
    [db]
  );

  const refresh = useCallback(() => {
    if (!db) return;
    const projectRows = selectAll<any>(
      `SELECT * FROM projects ORDER BY DATE(start_date) ASC`
    );
    const phases = selectAll<any>(`SELECT * FROM project_phases ORDER BY DATE(start_date) ASC`);
    const resources = selectAll<any>(`SELECT * FROM resources`);
    const notices = selectAll<any>(`SELECT * FROM notifications ORDER BY DATE(created_at) DESC`);

    const mapped = projectRows.map((row) => {
      const projectPhases = phases.filter((phase) => phase.project_id === row.id).map(mapPhaseRow);
      const projectResources = resources
        .filter((resource) => resource.project_id === row.id)
        .map(mapResourceRow);
      return {
        ...mapProjectRow(row),
        phases: projectPhases,
        resources: projectResources
      };
    });

    setProjects(mapped);
    setNotifications(notices.map(mapNotificationRow));
  }, [db, selectAll]);

  useEffect(() => {
    if (ready) {
      refresh();
    }
  }, [ready, refresh]);

  const run = useCallback(
    (sql: string, params: any[] = []) => {
      if (!db) throw new Error('Database not ready');
      db.run(sql, params);
      persist(db);
      refresh();
    },
    [db, persist, refresh]
  );

  const addProject = useCallback(
    (payload: ProjectPayload) => {
      const id = crypto.randomUUID();
      const timestamp = new Date().toISOString();
      run(
        `INSERT INTO projects (id, name, description, status, start_date, end_date, budget, spent, health, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          payload.name,
          payload.description,
          payload.status,
          payload.startDate,
          payload.endDate,
          payload.budget,
          payload.spent,
          payload.health,
          timestamp,
          timestamp
        ]
      );
      return id;
    },
    [run]
  );

  const updateProject = useCallback(
    (id: string, payload: Partial<ProjectPayload>) => {
      if (!db) return;
      const project = selectAll<any>(`SELECT * FROM projects WHERE id = ? LIMIT 1`, [id])[0];
      if (!project) return;
      const merged = {
        ...mapProjectRow(project),
        ...payload
      };
      run(
        `UPDATE projects SET name = ?, description = ?, status = ?, start_date = ?, end_date = ?, budget = ?, spent = ?, health = ?, updated_at = ? WHERE id = ?`,
        [
          merged.name,
          merged.description,
          merged.status,
          merged.startDate,
          merged.endDate,
          merged.budget,
          merged.spent,
          merged.health,
          new Date().toISOString(),
          id
        ]
      );
    },
    [db, run, selectAll]
  );

  const deleteProject = useCallback(
    (id: string) => {
      run(`DELETE FROM projects WHERE id = ?`, [id]);
    },
    [run]
  );

  const addPhase = useCallback(
    (projectId: string, payload: PhasePayload) => {
      const id = crypto.randomUUID();
      run(
        `INSERT INTO project_phases (id, project_id, name, start_date, end_date, progress, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, projectId, payload.name, payload.startDate, payload.endDate, payload.progress, payload.status]
      );
      return id;
    },
    [run]
  );

  const updatePhase = useCallback(
    (id: string, payload: Partial<PhasePayload>) => {
      if (!db) return;
      const phaseRow = selectAll<any>(`SELECT * FROM project_phases WHERE id = ? LIMIT 1`, [id])[0];
      if (!phaseRow) return;
      const merged = {
        ...mapPhaseRow(phaseRow),
        ...payload
      };
      run(
        `UPDATE project_phases
         SET name = ?, start_date = ?, end_date = ?, progress = ?, status = ?
         WHERE id = ?`,
        [merged.name, merged.startDate, merged.endDate, merged.progress, merged.status, id]
      );
    },
    [db, run, selectAll]
  );

  const deletePhase = useCallback(
    (id: string) => {
      run(`DELETE FROM project_phases WHERE id = ?`, [id]);
    },
    [run]
  );

  const addResource = useCallback(
    (projectId: string, payload: ResourcePayload) => {
      const id = crypto.randomUUID();
      run(
        `INSERT INTO resources (id, project_id, name, type, allocation)
         VALUES (?, ?, ?, ?, ?)`,
        [id, projectId, payload.name, payload.type, payload.allocation]
      );
      return id;
    },
    [run]
  );

  const updateResource = useCallback(
    (id: string, payload: Partial<ResourcePayload>) => {
      if (!db) return;
      const resourceRow = selectAll<any>(`SELECT * FROM resources WHERE id = ? LIMIT 1`, [id])[0];
      if (!resourceRow) return;
      const merged = {
        ...mapResourceRow(resourceRow),
        ...payload
      };
      run(
        `UPDATE resources SET name = ?, type = ?, allocation = ? WHERE id = ?`,
        [merged.name, merged.type, merged.allocation, id]
      );
    },
    [db, run, selectAll]
  );

  const deleteResource = useCallback(
    (id: string) => {
      run(`DELETE FROM resources WHERE id = ?`, [id]);
    },
    [run]
  );

  const markNotificationRead = useCallback(
    (id: string) => {
      run(`UPDATE notifications SET is_read = 1 WHERE id = ?`, [id]);
    },
    [run]
  );

  const value = useMemo<DatabaseContextValue>(
    () => ({
      ready,
      projects,
      notifications,
      refresh,
      addProject,
      updateProject,
      deleteProject,
      addPhase,
      updatePhase,
      deletePhase,
      addResource,
      updateResource,
      deleteResource,
      markNotificationRead
    }),
    [
      ready,
      projects,
      notifications,
      refresh,
      addProject,
      updateProject,
      deleteProject,
      addPhase,
      updatePhase,
      deletePhase,
      addResource,
      updateResource,
      deleteResource,
      markNotificationRead
    ]
  );

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within DatabaseProvider');
  }
  return context;
}
