import "server-only";
import { createClient } from "@libsql/client";
import { getLibsqlClientOptions } from "./libsql-config";

export async function runMigrations(): Promise<void> {
  const client = createClient(getLibsqlClientOptions());

  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      scope TEXT NOT NULL CHECK(scope IN ('hourly', 'daily')),
      window_start INTEGER NOT NULL,
      window_end INTEGER NOT NULL,
      summary TEXT NOT NULL,
      events TEXT NOT NULL DEFAULT '[]',
      run_id TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rules (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      priority INTEGER NOT NULL DEFAULT 5,
      enabled INTEGER NOT NULL DEFAULT 1,
      tags TEXT NOT NULL DEFAULT '[]',
      source TEXT NOT NULL DEFAULT 'user' CHECK(source IN ('user', 'agent')),
      confidence REAL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL CHECK(kind IN ('hourly', 'daily')),
      status TEXT NOT NULL DEFAULT 'running' CHECK(status IN ('running', 'success', 'error')),
      started_at INTEGER NOT NULL,
      finished_at INTEGER,
      transcript TEXT DEFAULT '[]',
      tool_calls TEXT DEFAULT '[]',
      error TEXT
    );

    CREATE TABLE IF NOT EXISTS suggestions (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      kind TEXT NOT NULL CHECK(kind IN ('calendar.create', 'calendar.delete', 'calendar.reschedule', 'rule.add')),
      payload TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected', 'applied')),
      auto_apply INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_memories_scope_start ON memories(scope, window_start);
    CREATE INDEX IF NOT EXISTS idx_runs_kind_started ON runs(kind, started_at);
    CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(status);
    CREATE INDEX IF NOT EXISTS idx_suggestions_run ON suggestions(run_id);

    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      source TEXT NOT NULL DEFAULT 'user' CHECK(source IN ('user', 'agent')),
      title TEXT NOT NULL,
      description TEXT,
      location TEXT,
      start_at INTEGER NOT NULL,
      end_at INTEGER NOT NULL,
      all_day INTEGER NOT NULL DEFAULT 0,
      timezone TEXT DEFAULT 'local',
      color TEXT,
      status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed', 'tentative', 'cancelled')),
      attendees TEXT DEFAULT '[]',
      recurrence TEXT,
      recurrence_parent_id TEXT,
      external_id TEXT,
      type TEXT NOT NULL DEFAULT 'other' CHECK(type IN ('deep_work','meeting','admin','personal','health','learning','social','other')),
      energy_cost TEXT NOT NULL DEFAULT 'medium' CHECK(energy_cost IN ('low','medium','high')),
      priority INTEGER NOT NULL DEFAULT 5,
      tags TEXT DEFAULT '[]',
      linked_rule_id TEXT,
      justification TEXT,
      actual_start_at INTEGER,
      actual_end_at INTEGER,
      completed_at INTEGER,
      outcome_notes TEXT
    );

    CREATE TABLE IF NOT EXISTS calendar_event_logs (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      at INTEGER NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('created','updated','completed','cancelled','rescheduled','annotated')),
      actor TEXT NOT NULL DEFAULT 'user' CHECK(actor IN ('user','agent')),
      diff TEXT,
      note TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_cal_events_start ON calendar_events(start_at);
    CREATE INDEX IF NOT EXISTS idx_cal_events_status_start ON calendar_events(status, start_at);
    CREATE INDEX IF NOT EXISTS idx_cal_events_type_start ON calendar_events(type, start_at);
    CREATE INDEX IF NOT EXISTS idx_cal_logs_event ON calendar_event_logs(event_id);
  `);

  client.close();
}
