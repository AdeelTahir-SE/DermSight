/**
 * Mock database client for Web environment to bypass expo-sqlite worker bundle issues.
 * Simulates Drizzle ORM operations via localStorage.
 */

import { getTableName } from "drizzle-orm";

const getLocalStorageKey = (tableName: string) => `dermsight_db_${tableName}`;

function getTableData(tableName: string): any[] {
  try {
    const data = localStorage.getItem(getLocalStorageKey(tableName));
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to read localStorage:", e);
    return [];
  }
}

function setTableData(tableName: string, data: any[]): void {
  try {
    localStorage.setItem(getLocalStorageKey(tableName), JSON.stringify(data));
  } catch (e) {
    console.error("Failed to write localStorage:", e);
  }
}

function matchesCondition(row: any, condition: any): boolean {
  if (!condition) return true;

  const constructorName = condition.constructor?.name;

  // Handle logical operators (Or, And)
  if (condition.conditions && Array.isArray(condition.conditions)) {
    if (constructorName === "Or" || condition.operator === "or") {
      return condition.conditions.some((cond: any) => matchesCondition(row, cond));
    }
    if (constructorName === "And" || condition.operator === "and") {
      return condition.conditions.every((cond: any) => matchesCondition(row, cond));
    }
  }

  // Handle binary operators (Eq, Like, etc.)
  if ("left" in condition && "right" in condition) {
    const colObj = condition.left;
    const value = condition.right;
    const colName = colObj?.name || colObj?.column?.name || "";
    const rowValue = row[colName];

    if (!colName) return true;

    if (constructorName === "Eq" || condition.operator === "eq") {
      return rowValue === value;
    }
    if (constructorName === "Like" || condition.operator === "like") {
      if (typeof rowValue !== "string" || typeof value !== "string") return false;
      const regexStr = "^" + value.replace(/%/g, ".*") + "$";
      const regex = new RegExp(regexStr, "i");
      return regex.test(rowValue);
    }

    return rowValue === value;
  }

  return true;
}

function resolveTableName(table: any): string {
  try {
    const name = getTableName(table);
    if (name) return name;
  } catch {
    // ignore
  }

  // Fallback heuristic based on column checks
  if (table && typeof table === "object") {
    if (table.id?.name === "id") {
      if (table.firstName) return "patients";
      if (table.predictedClass) return "assessments";
      if (table.entityType) return "sync_queue";
    }
  }
  return "";
}

class QueryBuilder {
  private tableName: string;
  private filterCondition: any = null;
  private sortOrder: any = null;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select() {
    return this;
  }

  from(table: any) {
    this.tableName = resolveTableName(table);
    return this;
  }

  where(condition: any) {
    this.filterCondition = condition;
    return this;
  }

  orderBy(order: any) {
    this.sortOrder = order;
    return this;
  }

  all() {
    if (!this.tableName) return [];
    let data = getTableData(this.tableName);

    if (this.filterCondition) {
      data = data.filter((row) => matchesCondition(row, this.filterCondition));
    }

    if (this.sortOrder) {
      const isDesc =
        this.sortOrder.direction === "desc" ||
        this.sortOrder.constructor?.name === "Desc";
      const colName = this.sortOrder.column?.name || "createdAt";

      data.sort((a, b) => {
        const valA = a[colName] || "";
        const valB = b[colName] || "";
        if (valA < valB) return isDesc ? 1 : -1;
        if (valA > valB) return isDesc ? -1 : 1;
        return 0;
      });
    }

    return data;
  }

  get() {
    const data = this.all();
    return data.length > 0 ? data[0] : undefined;
  }
}

class InsertBuilder {
  private tableName: string;
  private insertValues: any = null;

  constructor(table: any) {
    this.tableName = resolveTableName(table);
  }

  values(values: any) {
    this.insertValues = values;
    return this;
  }

  run() {
    if (!this.tableName || !this.insertValues) return;

    const data = getTableData(this.tableName);
    const row = { ...this.insertValues };

    if (this.tableName === "sync_queue" && !row.id) {
      const maxId = data.reduce((max, item) => Math.max(max, item.id || 0), 0);
      row.id = maxId + 1;
    }

    data.push(row);
    setTableData(this.tableName, data);
  }
}

class UpdateBuilder {
  private tableName: string;
  private updateValues: any = null;
  private filterCondition: any = null;

  constructor(table: any) {
    this.tableName = resolveTableName(table);
  }

  set(values: any) {
    this.updateValues = values;
    return this;
  }

  where(condition: any) {
    this.filterCondition = condition;
    return this;
  }

  run() {
    if (!this.tableName || !this.updateValues) return;

    let data = getTableData(this.tableName);
    let updated = false;

    data = data.map((row) => {
      if (matchesCondition(row, this.filterCondition)) {
        updated = true;
        return { ...row, ...this.updateValues };
      }
      return row;
    });

    if (updated) {
      setTableData(this.tableName, data);
    }
  }
}

class DeleteBuilder {
  private tableName: string;
  private filterCondition: any = null;

  constructor(table: any) {
    this.tableName = resolveTableName(table);
  }

  where(condition: any) {
    this.filterCondition = condition;
    return this;
  }

  run() {
    if (!this.tableName) return;
    const data = getTableData(this.tableName);
    const filtered = data.filter((row) => !matchesCondition(row, this.filterCondition));
    setTableData(this.tableName, filtered);
  }
}

export const db = {
  select: () => new QueryBuilder(""),
  insert: (table: any) => new InsertBuilder(table),
  update: (table: any) => new UpdateBuilder(table),
  delete: (table: any) => new DeleteBuilder(table),
};

export function initializeDatabase(): void {
  console.log("[Web DB] Initializing LocalStorage SQLite mock...");

  // One-time data cleanup: repair any malformed date_of_birth records in localStorage
  try {
    const normalizeDateOfBirth = (dob: string): string => {
      const parts = dob.replace(/\s+/g, "").split(/[-/]/);
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        if (year > 1000 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          const monthStr = month.toString().padStart(2, "0");
          const dayStr = day.toString().padStart(2, "0");
          return `${year}-${monthStr}-${dayStr}`;
        }
      }
      return dob;
    };

    // 1. Clean patients table
    const patientsKey = getLocalStorageKey("patients");
    const patientsData = localStorage.getItem(patientsKey);
    if (patientsData) {
      const patients = JSON.parse(patientsData);
      let updated = false;
      for (const p of patients) {
        const currentDob = p.dateOfBirth || p.date_of_birth || "";
        const normalized = normalizeDateOfBirth(currentDob);
        if (normalized && normalized !== currentDob) {
          if (p.dateOfBirth) p.dateOfBirth = normalized;
          if (p.date_of_birth) p.date_of_birth = normalized;
          updated = true;
        }
      }
      if (updated) {
        localStorage.setItem(patientsKey, JSON.stringify(patients));
        console.log("[Web DB] Repaired malformed dateOfBirth in patients table");
      }
    }

    // 2. Clean sync_queue payloads
    const queueKey = getLocalStorageKey("sync_queue");
    const queueData = localStorage.getItem(queueKey);
    if (queueData) {
      const queue = JSON.parse(queueData);
      let updated = false;
      for (const row of queue) {
        if (row.entity_type === "patient" || row.entityType === "patient") {
          try {
            const payload = typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
            if (payload && payload.dateOfBirth) {
              const normalized = normalizeDateOfBirth(payload.dateOfBirth);
              if (normalized !== payload.dateOfBirth) {
                payload.dateOfBirth = normalized;
                row.payload = JSON.stringify(payload);
                updated = true;
              }
            }
          } catch (e) {
            console.error("Failed to parse/repair web sync_queue payload:", e);
          }
        }
      }
      if (updated) {
        localStorage.setItem(queueKey, JSON.stringify(queue));
        console.log("[Web DB] Repaired malformed dateOfBirth in sync_queue payloads");
      }
    }
  } catch (err) {
    console.error("One-time web database cleanup failed:", err);
  }
}

export const rawDb = {
  execSync: (sql: string) => {
    console.log("[Web DB] Raw SQL execSync mock:", sql);
  },
};
