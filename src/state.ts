import type {
  AegisState,
  ShieldId,
  ShieldState,
  Policy,
  AuditEntry,
  TerminalLog,
  LogSeverity,
  Mission,
  BankAccount,
  EnterpriseProfile,
  ChatMessage,
  VerificationState,
} from '@/types';

let idCounter = 0;
export const uid = (prefix = 'id') => `${prefix}_${Date.now()}_${idCounter++}`;

export const SHIELD_ORDER: ShieldId[] = [
  'missionGuard',
  'policyEngine',
  'riskEngine',
  'smartContract',
  'timeLock',
  'circuitBreaker',
];

export const SHIELD_META: Record<
  ShieldId,
  { label: string; description: string }
> = {
  missionGuard: {
    label: 'Mission Guard',
    description: 'Validates mission intent against authorized scope.',
  },
  policyEngine: {
    label: 'Policy Engine',
    description: 'Enforces spending limits, merchant allowlists & rules.',
  },
  riskEngine: {
    label: 'Risk Engine',
    description: 'Scores transaction risk using behavioral models.',
  },
  smartContract: {
    label: 'Smart Contract',
    description: 'On-chain escrow enforcing budget & expiry constraints.',
  },
  timeLock: {
    label: 'Time Lock',
    description: 'Delay window before any irreversible action executes.',
  },
  circuitBreaker: {
    label: 'Circuit Breaker',
    description: 'Halts all activity when anomaly threshold is breached.',
  },
};

export const DEFAULT_POLICIES: Policy[] = [
  {
    id: 'p1',
    name: 'Max Spend Per Mission',
    description: 'No single mission may spend more than ₹1,00,000.',
    enabled: true,
    rule: 'mission.budget <= 100000',
  },
  {
    id: 'p2',
    name: 'Merchant Allowlist',
    description: 'Only approved merchants may receive funds.',
    enabled: true,
    rule: 'merchant IN (AWS India, GitHub, Stripe India, IndiGo)',
  },
  {
    id: 'p3',
    name: 'Session Expiry',
    description: 'Mission wallets expire after 24 hours.',
    enabled: true,
    rule: 'now < mission.expiry',
  },
  {
    id: 'p4',
    name: 'Prompt Injection Defense',
    description: 'Blocks instructions that attempt to override policy.',
    enabled: false,
    rule: 'intent.signature == verified',
  },
  {
    id: 'p5',
    name: 'Rate Limit',
    description: 'Maximum 10 transactions per mission per minute.',
    enabled: false,
    rule: 'tx.rate <= 10/min',
  },
];

const DEFAULT_PROFILE: EnterpriseProfile = {
  owner: 'Rajesh Sharma',
  role: 'Chief Financial Officer',
  enterprise: 'Apex Labs India Pvt Ltd',
  plan: 'Enterprise Sovereign',
  perMissionCap: 100000,
  dailyOutflowCeiling: 300000,
  dailySpent: 0,      // ← changed from 50000
  highestSpend: 0,
};

const DEFAULT_BANKS: BankAccount[] = [
  {
    id: 'b1',
    bank: 'HDFC Corporate Banking',
    label: 'Operating Account',
    last4: '8842',
    ifsc: 'HDFC0008842',
    balance: 600000,
    type: 'Corporate Current',
    status: 'connected',
  },
  {
    id: 'b2',
    bank: 'ICICI Commercial Bank',
    label: 'Reserve Treasury',
    last4: '1190',
    ifsc: 'ICIC0001190',
    balance: 400000,
    type: 'Sweep / Treasury',
    status: 'connected',
  },
];

function makeShields(): Record<ShieldId, ShieldState> {
  const out = {} as Record<ShieldId, ShieldState>;
  for (const id of SHIELD_ORDER) {
    out[id] = {
      id,
      label: SHIELD_META[id].label,
      description: SHIELD_META[id].description,
      status: 'idle',
      lastCheck: '—',
    };
  }
  return out;
}

export function initialState(): AegisState {
  return {
    mission: null,
    shields: makeShields(),
    logs: [],
    chat: [
      {
        id: uid('msg'),
        role: 'aegis',
        text: 'AEGIS online. Issue a mission instruction to provision a Mission Wallet. Try "Buy AWS Server for ₹45,000".',
        timestamp: Date.now(),
      },
    ],
    audit: [],
    policies: DEFAULT_POLICIES.map((p) => ({ ...p })),
    walletStatus: 'empty',
    // trustScore: 98,  // ❌ REMOVED
    attackCount: 0,
    blockedCount: 0,
    consecutiveFailures: 0,
    bankAccounts: DEFAULT_BANKS,
    profile: DEFAULT_PROFILE,
    reserveBalance: 1000000,
    allocatedBalance: 0,
    timeLockRemaining: 0,
    verification: { active: false, missionId: null, level: null, message: null },
  };
}

export type Action =
  | { type: 'INIT_STATE'; payload: Partial<AegisState> }
  | { type: 'RESET' }
  | { type: 'ADD_LOG'; payload: { message: string; severity: LogSeverity; timestamp?: number } }
  | { type: 'ADD_CHAT'; payload: { role: 'user' | 'aegis'; text: string; timestamp?: number } }
  | { type: 'UPDATE_SHIELD'; payload: { id: ShieldId; status: ShieldState['status']; lastCheck?: string } }
  | { type: 'SET_MISSION'; payload: Mission | null }
  | { type: 'SET_WALLET_STATUS'; payload: AegisState['walletStatus'] }
  // | { type: 'SET_TRUST'; payload: number }   // ❌ REMOVED
  | { type: 'ADD_AUDIT'; payload: AuditEntry }
  | { type: 'UPDATE_ATTACK_STATS'; payload: { attackCount: number; blockedCount: number } }
  | { type: 'UPDATE_POLICIES'; payload: Policy[] }
  | { type: 'UPDATE_BALANCES'; payload: { reserveBalance: number; allocatedBalance: number } }
  | { type: 'UPDATE_PROFILE'; payload: EnterpriseProfile }
  | { type: 'UPDATE_MISSION'; payload: Partial<Mission> }
  | { type: 'UPDATE_TIMELOCK'; payload: number }
  | { type: 'CLEAR_MISSION' }
  | { type: 'SET_VERIFICATION'; payload: { missionId: string; level: string; message: string } }
  | { type: 'CLEAR_VERIFICATION' };

export function reducer(state: AegisState, action: Action): AegisState {
  switch (action.type) {
    case 'INIT_STATE':
      return {
        ...initialState(),
        ...action.payload,
        logs: Array.isArray(action.payload?.logs) ? action.payload.logs : state.logs || [],
        chat: Array.isArray(action.payload?.chat) ? action.payload.chat : state.chat || [],
        audit: Array.isArray(action.payload?.audit) ? action.payload.audit : state.audit || [],
        shields: action.payload?.shields || state.shields || makeShields(),
        mission: action.payload?.mission !== undefined ? action.payload.mission : state.mission,
        walletStatus: action.payload?.walletStatus || state.walletStatus || 'empty',
        verification: state.verification || { active: false, missionId: null, level: null, message: null },
      };

    case 'RESET':
      return initialState();

    case 'ADD_LOG': {
      const currentLogs = Array.isArray(state.logs) ? state.logs : [];
      const log: TerminalLog = {
        id: uid('log'),
        message: action.payload.message,
        severity: action.payload.severity,
        timestamp: action.payload.timestamp || Date.now(),
      };
      return { ...state, logs: [...currentLogs, log].slice(-200) };
    }

    case 'ADD_CHAT': {
      const currentChat = Array.isArray(state.chat) ? state.chat : [];
      const msg: ChatMessage = {
        id: uid('msg'),
        role: action.payload.role,
        text: action.payload.text,
        timestamp: action.payload.timestamp || Date.now(),
      };
      return { ...state, chat: [...currentChat, msg] };
    }

    case 'UPDATE_SHIELD': {
      const { id, status, lastCheck } = action.payload;
      const shields = state.shields || makeShields();
      return {
        ...state,
        shields: {
          ...shields,
          [id]: {
            ...(shields[id] || { id, label: id, description: '', status: 'idle', lastCheck: '—' }),
            status,
            lastCheck: lastCheck || shields[id]?.lastCheck || '—',
          },
        },
      };
    }

    case 'SET_MISSION':
      return {
        ...state,
        mission: action.payload,
        walletStatus: action.payload ? 'active' : 'empty',
      };

    case 'SET_WALLET_STATUS':
      return { ...state, walletStatus: action.payload };

    // case 'SET_TRUST':   // ❌ REMOVED
    //   return { ...state, trustScore: Math.max(0, Math.min(100, action.payload)) };

    case 'ADD_AUDIT': {
      const currentAudit = Array.isArray(state.audit) ? state.audit : [];
      return {
        ...state,
        audit: [action.payload, ...currentAudit].slice(0, 100),
      };
    }

    case 'UPDATE_ATTACK_STATS':
      return {
        ...state,
        attackCount: action.payload.attackCount,
        blockedCount: action.payload.blockedCount,
      };

    case 'UPDATE_POLICIES':
      return { ...state, policies: action.payload };

    case 'UPDATE_BALANCES':
      return {
        ...state,
        reserveBalance: action.payload.reserveBalance,
        allocatedBalance: action.payload.allocatedBalance,
      };

    case 'UPDATE_PROFILE':
      return { ...state, profile: action.payload };

    case 'UPDATE_MISSION':
      return state.mission
        ? { ...state, mission: { ...state.mission, ...action.payload } }
        : state;

    case 'UPDATE_TIMELOCK':
      return { ...state, timeLockRemaining: action.payload };

    case 'CLEAR_MISSION':
      return { ...state, mission: null, walletStatus: 'empty' };

    case 'SET_VERIFICATION': {
      const isClosingEvent = ['resolved', 'rejected'].includes(action.payload.level);
      return {
        ...state,
        verification: {
          active: !isClosingEvent,
          missionId: action.payload.missionId,
          level: action.payload.level as VerificationState['level'],
          message: action.payload.message,
        },
      };
    }

    case 'CLEAR_VERIFICATION':
      return { ...state, verification: { active: false, missionId: null, level: null, message: null } };

    default:
      return state;
  }
}