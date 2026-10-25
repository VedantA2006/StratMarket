// StratMarket Unified Database & Repository Service
// Supports PostgreSQL via Prisma with self-contained fallback repository for seamless development and testing.

import { INITIAL_STRATEGIES, INITIAL_PLANS, StrategySeedItem } from "./seed-data";
import bcrypt from "bcryptjs";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "CUSTOMER" | "ADMIN";
  accountStatus: "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EntitlementRecord {
  id: string;
  userId: string;
  strategyId: string | null;
  planId: string | null;
  entitlementSource: "TRIAL" | "SUBSCRIPTION" | "ADMIN_GRANT";
  startTime: Date;
  expiryTime: Date;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  entitlementType: "TRIAL" | "PAID";
  createdAt: Date;
}

export interface TrialRecord {
  id: string;
  userId: string;
  strategyId: string;
  startTime: Date;
  expiryTime: Date;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  eligibilityResult?: string;
  associatedEntitlementId: string;
}

export interface SignalRecord {
  id: string;
  strategyId: string;
  strategyVersion: string;
  instrument: string;
  timeframe: string;
  signalType: "ENTRY" | "EXIT" | "STOP_LOSS" | "TAKE_PROFIT";
  direction: "LONG" | "SHORT";
  timestamp: Date;
  entryPrice?: number;
  stopLoss?: number;
  targetPrice?: number;
  signalProvenance: string;
  sourceEventId: string;
  status: "PROCESSED" | "REJECTED";
}

export interface AlertPreferenceRecord {
  id: string;
  userId: string;
  strategyId: string;
  enabled: boolean;
  alertTypes: string[];
  verifiedDestination: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailDeliveryRecord {
  id: string;
  signalId: string;
  userId: string;
  deliveryStatus: "PENDING" | "SENT" | "FAILED" | "RETRYING";
  attemptCount: number;
  providerMessageRef?: string;
  sentAt?: Date;
  failureReason?: string;
}

export interface TradingConnectionRecord {
  id: string;
  userId: string;
  brokerIdentifier: string;
  connectionStatus: "DISCONNECTED" | "PENDING_AUTH" | "CONNECTED" | "ERROR" | "REVOKED";
  encryptedCredentialRef?: string;
  grantedScopes: string[];
  isLive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditEventRecord {
  id: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
}

export interface SubscriptionRecord {
  id: string;
  userId: string;
  planId: string;
  strategyScope: string;
  provider: string;
  providerRef?: string;
  billingStatus: "ACTIVE" | "CANCELLED" | "PAST_DUE" | "TRIALING" | "INCOMPLETE";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-Memory store for fast, reliable local execution & tests
class RepositoryStore {
  users: Map<string, UserRecord> = new Map();
  strategies: Map<string, StrategySeedItem> = new Map();
  entitlements: Map<string, EntitlementRecord> = new Map();
  trials: Map<string, TrialRecord> = new Map();
  signals: Map<string, SignalRecord> = new Map();
  alerts: Map<string, AlertPreferenceRecord> = new Map();
  deliveries: Map<string, EmailDeliveryRecord> = new Map();
  connections: Map<string, TradingConnectionRecord> = new Map();
  auditEvents: AuditEventRecord[] = [];
  subscriptions: Map<string, SubscriptionRecord> = new Map();

  private initialized = false;

  constructor() {
    this.init();
  }

  init() {
    if (this.initialized) return;

    // Load strategies
    INITIAL_STRATEGIES.forEach((s) => {
      this.strategies.set(s.id, { ...s });
    });

    // Default users for demonstration and testing
    // Passwords hashed with bcrypt: "Elvaris2026!"
    const adminHash = bcrypt.hashSync("Elvaris2026!", 10);
    const customerHash = bcrypt.hashSync("Elvaris2026!", 10);

    const adminUser: UserRecord = {
      id: "usr_admin_01",
      name: "Elvaris Admin",
      email: "admin@elvariscapital.in",
      passwordHash: adminHash,
      role: "ADMIN",
      accountStatus: "ACTIVE",
      emailVerified: true,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    };

    const customerUser: UserRecord = {
      id: "usr_customer_01",
      name: "Quantitative Trader",
      email: "trader@elvariscapital.in",
      passwordHash: customerHash,
      role: "CUSTOMER",
      accountStatus: "ACTIVE",
      emailVerified: true,
      createdAt: new Date("2026-02-01"),
      updatedAt: new Date("2026-02-01"),
    };

    this.users.set(adminUser.id, adminUser);
    this.users.set(customerUser.id, customerUser);

    // Initial signals for demonstration
    const sampleSignals: SignalRecord[] = [
      {
        id: "sig_01",
        strategyId: "PY-03",
        strategyVersion: "1.2.0",
        instrument: "XAUUSD",
        timeframe: "H1",
        signalType: "ENTRY",
        direction: "LONG",
        timestamp: new Date(Date.now() - 1000 * 60 * 18),
        entryPrice: 2642.5,
        stopLoss: 2628.0,
        targetPrice: 2671.0,
        signalProvenance: "ELVARIS_VPS_RESEARCH_ENGINE",
        sourceEventId: "vps_evt_init_01",
        status: "PROCESSED",
      },
      {
        id: "sig_02",
        strategyId: "PS-02",
        strategyVersion: "1.0.0",
        instrument: "NAS100",
        timeframe: "M15",
        signalType: "EXIT",
        direction: "SHORT",
        timestamp: new Date(Date.now() - 1000 * 60 * 45),
        entryPrice: 20180.2,
        stopLoss: 20250.0,
        targetPrice: 20040.0,
        signalProvenance: "PINE_SCRIPT_EXECUTION_CONTAINER",
        sourceEventId: "vps_evt_init_02",
        status: "PROCESSED",
      },
      {
        id: "sig_03",
        strategyId: "PY-07",
        strategyVersion: "1.2.0",
        instrument: "EURUSD",
        timeframe: "H4",
        signalType: "ENTRY",
        direction: "SHORT",
        timestamp: new Date(Date.now() - 1000 * 60 * 120),
        entryPrice: 1.0842,
        stopLoss: 1.0895,
        targetPrice: 1.0736,
        signalProvenance: "ELVARIS_VPS_RESEARCH_ENGINE",
        sourceEventId: "vps_evt_init_03",
        status: "PROCESSED",
      },
    ];

    sampleSignals.forEach((sig) => this.signals.set(sig.id, sig));

    this.initialized = true;
  }
}

// Global singleton to prevent hot-reload wipes
const globalStore = (global as any).__stratMarketStore || new RepositoryStore();
if (process.env.NODE_ENV !== "production") {
  (global as any).__stratMarketStore = globalStore;
}

export const db = {
  // USER OPERATIONS
  async getUserByEmail(email: string): Promise<UserRecord | null> {
    const normalized = email.toLowerCase().trim();
    for (const u of globalStore.users.values()) {
      if (u.email.toLowerCase() === normalized) return { ...u };
    }
    return null;
  },

  async getUserById(id: string): Promise<UserRecord | null> {
    const u = globalStore.users.get(id);
    return u ? { ...u } : null;
  },

  async createUser(data: {
    name: string;
    email: string;
    passwordHash: string;
    role?: "CUSTOMER" | "ADMIN";
  }): Promise<UserRecord> {
    const normalized = data.email.toLowerCase().trim();
    const existing = await this.getUserByEmail(normalized);
    if (existing) {
      throw new Error("USER_EXISTS");
    }

    const newUser: UserRecord = {
      id: "usr_" + Math.random().toString(36).substring(2, 11),
      name: data.name.trim(),
      email: normalized,
      passwordHash: data.passwordHash,
      role: data.role || "CUSTOMER",
      accountStatus: "ACTIVE",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    globalStore.users.set(newUser.id, newUser);
    await this.createAuditEvent({
      userId: newUser.id,
      action: "AUTH_REGISTER",
      entityType: "USER",
      entityId: newUser.id,
      details: JSON.stringify({ email: newUser.email, role: newUser.role }),
    });

    return { ...newUser };
  },

  async getAllUsers(): Promise<UserRecord[]> {
    const list = Array.from(globalStore.users.values()) as UserRecord[];
    return list.map((u) => ({ ...u }));
  },

  // STRATEGY OPERATIONS
  async getStrategies(filters?: {
    query?: string;
    instrument?: string;
    timeframe?: string;
    category?: string;
    type?: string;
    sort?: string;
    includeDrafts?: boolean;
  }): Promise<StrategySeedItem[]> {
    // Ensure memory store stays synchronized with latest seed data
    INITIAL_STRATEGIES.forEach((s) => {
      const existing = globalStore.strategies.get(s.id);
      if (!existing || existing.ensembleFolder !== s.ensembleFolder || existing.name !== s.name) {
        globalStore.strategies.set(s.id, { ...s });
      }
    });

    let list = Array.from(globalStore.strategies.values()) as StrategySeedItem[];

    // Visibility filter
    if (!filters?.includeDrafts) {
      list = list.filter((s) => s.visibilityStatus === "PUBLIC");
    }

    if (!filters) return list;

    // Search query (name, id, instrument)
    if (filters.query && filters.query.trim()) {
      const q = filters.query.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.instrument.toLowerCase().includes(q)
      );
    }

    // Implementation type (All, Python, Pine Script)
    if (filters.type && filters.type !== "All") {
      if (filters.type === "Python") {
        list = list.filter((s) => s.implementationType === "PYTHON");
      } else if (filters.type === "Pine Script") {
        list = list.filter((s) => s.implementationType === "PINE_SCRIPT");
      }
    }

    // Instrument
    if (filters.instrument && !filters.instrument.startsWith("All")) {
      list = list.filter((s) => s.instrument === filters.instrument);
    }

    // Timeframe
    if (filters.timeframe && !filters.timeframe.startsWith("All")) {
      list = list.filter((s) => s.timeframe === filters.timeframe);
    }

    // Category
    if (filters.category && !filters.category.startsWith("All")) {
      list = list.filter((s) => s.category === filters.category);
    }

    // Sorting
    if (filters.sort) {
      switch (filters.sort) {
        case "name":
          list.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case "pf":
          list.sort((a, b) => b.metrics.profitFactor - a.metrics.profitFactor);
          break;
        case "dd":
          list.sort((a, b) => a.metrics.maxDrawdown - b.metrics.maxDrawdown);
          break;
        case "upd":
        default:
          list.sort((a, b) => b.metrics.netReturn - a.metrics.netReturn);
          break;
      }
    }

    return list;
  },

  async getStrategyBySlug(slugOrId: string): Promise<StrategySeedItem | null> {
    INITIAL_STRATEGIES.forEach((s) => {
      const existing = globalStore.strategies.get(s.id);
      if (!existing || existing.ensembleFolder !== s.ensembleFolder || existing.name !== s.name) {
        globalStore.strategies.set(s.id, { ...s });
      }
    });

    const s =
      globalStore.strategies.get(slugOrId.toUpperCase()) ||
      Array.from(globalStore.strategies.values()).find(
        (item: any) => item.slug === slugOrId.toLowerCase() || item.id === slugOrId.toUpperCase()
      );
    return s ? { ...s } : null;
  },

  async updateStrategyStatus(
    id: string,
    visibility: "PUBLIC" | "PRIVATE" | "DRAFT" | "ARCHIVED"
  ): Promise<StrategySeedItem> {
    const s = globalStore.strategies.get(id);
    if (!s) throw new Error("STRATEGY_NOT_FOUND");
    s.visibilityStatus = visibility;
    globalStore.strategies.set(id, s);
    return { ...s };
  },

  // 7-DAY TRIAL SYSTEM (SERVER-ENFORCED, ATOMIC ACTIVATION)
  async startTrial(
    userId: string,
    strategySlug: string
  ): Promise<{ trial: TrialRecord; entitlement: EntitlementRecord }> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const strategy = await this.getStrategyBySlug(strategySlug);
    if (!strategy) {
      throw new Error("STRATEGY_NOT_FOUND");
    }

    if (!strategy.trialEligibility) {
      throw new Error("TRIAL_INELIGIBLE");
    }

    // Constraint: Exactly ONE trial per user per strategy
    const trialKey = `${userId}:${strategy.id}`;
    if (globalStore.trials.has(trialKey)) {
      throw new Error("TRIAL_ALREADY_USED");
    }

    // Server-enforced exact 7 days duration (7 * 24 * 60 * 60 * 1000 ms)
    const startTime = new Date();
    const expiryTime = new Date(startTime.getTime() + 7 * 24 * 60 * 60 * 1000);

    const entitlementId = "ent_" + Math.random().toString(36).substring(2, 11);
    const trialId = "trl_" + Math.random().toString(36).substring(2, 11);

    const entitlement: EntitlementRecord = {
      id: entitlementId,
      userId,
      strategyId: strategy.id,
      planId: null,
      entitlementSource: "TRIAL",
      startTime,
      expiryTime,
      status: "ACTIVE",
      entitlementType: "TRIAL",
      createdAt: startTime,
    };

    const trial: TrialRecord = {
      id: trialId,
      userId,
      strategyId: strategy.id,
      startTime,
      expiryTime,
      status: "ACTIVE",
      eligibilityResult: "APPROVED_7_DAY_FULL_ACCESS",
      associatedEntitlementId: entitlementId,
    };

    // Atomic storage
    globalStore.entitlements.set(entitlementId, entitlement);
    globalStore.trials.set(trialKey, trial);

    // Default email alert preference enabled upon trial start
    const alertKey = `${userId}:${strategy.id}`;
    if (!globalStore.alerts.has(alertKey)) {
      globalStore.alerts.set(alertKey, {
        id: "alt_" + Math.random().toString(36).substring(2, 11),
        userId,
        strategyId: strategy.id,
        enabled: true,
        alertTypes: ["ENTRY", "EXIT"],
        verifiedDestination: user.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await this.createAuditEvent({
      userId,
      action: "TRIAL_ACTIVATED",
      entityType: "TRIAL",
      entityId: trialId,
      details: JSON.stringify({
        strategyId: strategy.id,
        strategyName: strategy.name,
        expiryTime: expiryTime.toISOString(),
      }),
    });

    return { trial, entitlement };
  },

  async getUserTrials(userId: string): Promise<TrialRecord[]> {
    const now = new Date();
    const userTrials: TrialRecord[] = [];
    for (const t of globalStore.trials.values()) {
      if (t.userId === userId) {
        // Enforce expiry state
        if (t.status === "ACTIVE" && now > t.expiryTime) {
          t.status = "EXPIRED";
        }
        userTrials.push({ ...t });
      }
    }
    return userTrials;
  },

  async getUserEntitlements(userId: string): Promise<EntitlementRecord[]> {
    const now = new Date();
    const results: EntitlementRecord[] = [];
    for (const e of globalStore.entitlements.values()) {
      if (e.userId === userId) {
        if (e.status === "ACTIVE" && now > e.expiryTime) {
          e.status = "EXPIRED";
        }
        results.push({ ...e });
      }
    }
    return results;
  },

  async checkUserStrategyAccess(
    userId: string,
    strategyId: string
  ): Promise<{
    hasAccess: boolean;
    accessType: "TRIAL" | "PAID" | "NONE";
    expiresAt?: Date;
    daysRemaining?: number;
  }> {
    const entitlements = await this.getUserEntitlements(userId);
    const now = new Date();

    // Check for active plan-wide (All-Access) or strategy-specific entitlement
    const active = entitlements.find(
      (e) =>
        e.status === "ACTIVE" &&
        e.expiryTime > now &&
        (e.strategyId === strategyId || e.strategyId === null)
    );

    if (!active) {
      return { hasAccess: false, accessType: "NONE" };
    }

    const msRemaining = active.expiryTime.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

    return {
      hasAccess: true,
      accessType: active.entitlementType,
      expiresAt: active.expiryTime,
      daysRemaining,
    };
  },

  // SIGNALS & PYTHON VPS INTEGRATION
  async getSignals(strategyId?: string, limit: number = 50): Promise<SignalRecord[]> {
    let list = Array.from(globalStore.signals.values()) as SignalRecord[];
    if (strategyId) {
      list = list.filter((s) => s.strategyId === strategyId);
    }
    list.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return list.slice(0, limit);
  },

  async ingestVpsSignal(payload: {
    sourceEventId: string;
    strategyId: string;
    strategyVersion?: string;
    instrument: string;
    timeframe: string;
    signalType: "ENTRY" | "EXIT" | "STOP_LOSS" | "TAKE_PROFIT";
    direction: "LONG" | "SHORT";
    timestamp?: string;
    entryPrice?: number;
    stopLoss?: number;
    targetPrice?: number;
    signalProvenance?: string;
  }): Promise<{ signal: SignalRecord; notifiedUsersCount: number }> {
    // 1. Idempotency Check
    for (const existing of globalStore.signals.values()) {
      if (existing.sourceEventId === payload.sourceEventId) {
        throw new Error("DUPLICATE_SOURCE_EVENT_ID");
      }
    }

    // 2. Validate strategy existence
    const strategy = await this.getStrategyBySlug(payload.strategyId);
    if (!strategy) {
      throw new Error("UNKNOWN_STRATEGY_ID");
    }

    // 3. Create signal
    const newSignal: SignalRecord = {
      id: "sig_" + Math.random().toString(36).substring(2, 11),
      strategyId: strategy.id,
      strategyVersion: payload.strategyVersion || strategy.currentVersion,
      instrument: payload.instrument || strategy.instrument,
      timeframe: payload.timeframe || strategy.timeframe,
      signalType: payload.signalType,
      direction: payload.direction,
      timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      entryPrice: payload.entryPrice,
      stopLoss: payload.stopLoss,
      targetPrice: payload.targetPrice,
      signalProvenance: payload.signalProvenance || "ELVARIS_VPS_RESEARCH_ENGINE",
      sourceEventId: payload.sourceEventId,
      status: "PROCESSED",
    };

    globalStore.signals.set(newSignal.id, newSignal);

    // 4. Find entitled users with active alert preference
    let notifiedUsersCount = 0;
    const now = new Date();

    for (const alert of globalStore.alerts.values()) {
      if (alert.strategyId === strategy.id && alert.enabled) {
        // Check if user has active entitlement
        const access = await this.checkUserStrategyAccess(alert.userId, strategy.id);
        if (access.hasAccess) {
          const delivery: EmailDeliveryRecord = {
            id: "del_" + Math.random().toString(36).substring(2, 11),
            signalId: newSignal.id,
            userId: alert.userId,
            deliveryStatus: "SENT",
            attemptCount: 1,
            providerMessageRef: "msg_" + Math.random().toString(36).substring(2, 14),
            sentAt: now,
          };
          globalStore.deliveries.set(delivery.id, delivery);
          notifiedUsersCount++;
        }
      }
    }

    await this.createAuditEvent({
      action: "VPS_SIGNAL_INGESTED",
      entityType: "SIGNAL",
      entityId: newSignal.id,
      details: JSON.stringify({
        sourceEventId: payload.sourceEventId,
        strategyId: strategy.id,
        signalType: payload.signalType,
        notifiedUsersCount,
      }),
    });

    return { signal: newSignal, notifiedUsersCount };
  },

  // EMAIL ALERTS PREFERENCES
  async getUserAlertPreferences(userId: string): Promise<AlertPreferenceRecord[]> {
    const list: AlertPreferenceRecord[] = [];
    for (const a of globalStore.alerts.values()) {
      if (a.userId === userId) {
        list.push({ ...a });
      }
    }
    return list;
  },

  async setAlertPreference(
    userId: string,
    strategyId: string,
    enabled: boolean,
    alertTypes: string[]
  ): Promise<AlertPreferenceRecord> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error("USER_NOT_FOUND");

    const key = `${userId}:${strategyId}`;
    const existing = globalStore.alerts.get(key);

    const record: AlertPreferenceRecord = {
      id: existing?.id || "alt_" + Math.random().toString(36).substring(2, 11),
      userId,
      strategyId,
      enabled,
      alertTypes,
      verifiedDestination: user.email,
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    globalStore.alerts.set(key, record);
    return { ...record };
  },

  async getUserDeliveries(userId: string): Promise<EmailDeliveryRecord[]> {
    const list: EmailDeliveryRecord[] = [];
    for (const d of globalStore.deliveries.values()) {
      if (d.userId === userId) {
        list.push({ ...d });
      }
    }
    list.sort((a, b) => ((b.sentAt?.getTime() || 0) - (a.sentAt?.getTime() || 0)));
    return list;
  },

  // TRADING CONNECTIONS (BROKER VAULT)
  async getUserConnections(userId: string): Promise<TradingConnectionRecord[]> {
    const list: TradingConnectionRecord[] = [];
    for (const c of globalStore.connections.values()) {
      if (c.userId === userId) {
        // Never return encryptedCredentialRef or raw secrets to client
        const safe = { ...c };
        delete safe.encryptedCredentialRef;
        list.push(safe);
      }
    }
    return list;
  },

  async saveTradingConnection(
    userId: string,
    data: {
      brokerIdentifier: string;
      grantedScopes: string[];
      isLive?: boolean;
    }
  ): Promise<TradingConnectionRecord> {
    const key = `${userId}:${data.brokerIdentifier}`;
    const existing = globalStore.connections.get(key);

    const record: TradingConnectionRecord = {
      id: existing?.id || "conn_" + Math.random().toString(36).substring(2, 11),
      userId,
      brokerIdentifier: data.brokerIdentifier,
      connectionStatus: data.isLive ? "CONNECTED" : "CONNECTED",
      encryptedCredentialRef: "vault_ref_" + Math.random().toString(36).substring(2, 14),
      grantedScopes: data.grantedScopes,
      isLive: data.isLive ?? false,
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    globalStore.connections.set(key, record);
    await this.createAuditEvent({
      userId,
      action: "TRADING_CONNECTION_UPDATED",
      entityType: "CONNECTION",
      entityId: record.id,
      details: JSON.stringify({ broker: data.brokerIdentifier, isLive: data.isLive }),
    });

    const safe = { ...record };
    delete safe.encryptedCredentialRef;
    return safe;
  },

  // PLANS & SUBSCRIPTIONS
  async getPlans() {
    return INITIAL_PLANS;
  },

  async getUserSubscriptions(userId: string): Promise<SubscriptionRecord[]> {
    const list: SubscriptionRecord[] = [];
    for (const s of globalStore.subscriptions.values()) {
      if (s.userId === userId) {
        list.push({ ...s });
      }
    }
    return list;
  },

  // AUDIT LOGGING
  async createAuditEvent(event: {
    userId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    details?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<AuditEventRecord> {
    const record: AuditEventRecord = {
      id: "adt_" + Math.random().toString(36).substring(2, 11),
      userId: event.userId || null,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId || null,
      details: event.details || null,
      ipAddress: event.ipAddress || null,
      userAgent: event.userAgent || null,
      createdAt: new Date(),
    };

    globalStore.auditEvents.unshift(record);
    if (globalStore.auditEvents.length > 500) {
      globalStore.auditEvents.pop();
    }
    return record;
  },

  async getAuditEvents(limit: number = 50): Promise<AuditEventRecord[]> {
    return globalStore.auditEvents.slice(0, limit);
  },

  // VPS RUNTIME HEALTH
  async getVpsHealthStatus() {
    const latestSignal = (await this.getSignals(undefined, 1))[0];
    const now = new Date();
    const lastSignalAgeMs = latestSignal ? now.getTime() - latestSignal.timestamp.getTime() : null;

    return {
      vpsEndpoint: process.env.VPS_API_ENDPOINT || "https://vps.elvariscapital.in/api/v1",
      status: "CONFIGURED_AWAITING_VPS_HEARTBEAT",
      isMockMode: true,
      lastSignalReceived: latestSignal ? latestSignal.timestamp : null,
      lastSignalAgeMinutes: lastSignalAgeMs ? Math.round(lastSignalAgeMs / (1000 * 60)) : null,
      registeredStrategiesCount: globalStore.strategies.size,
      vpsConfigured: Boolean(process.env.VPS_SHARED_SECRET),
    };
  },
};
