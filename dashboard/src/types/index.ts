// ============================================================================
// Project Amnion 2.0 - TypeScript Interfaces
// ============================================================================

// ==--------------------------------------------------------------------------
// System & Stats Types
// ==--------------------------------------------------------------------------

export interface CpuStats {
  cores: number;
  model: string;
  loadAvg1m: number;
  loadAvg5m: number;
  loadAvg15m: number;
}

export interface MemoryStats {
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  usagePercentage: number;
}

export interface DiskStats {
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  usagePercentage: number;
}

export interface NetworkStats {
  rxSpeedBytesPerSec: number;
  txSpeedBytesPerSec: number;
}

export interface SystemInfo {
  uptimeSeconds: number;
  release: string;
}

export interface UserStats {
  active: number;
  total: number;
}

export interface ProtocolDistribution {
  hysteria2: number;
  tuic: number;
  vless_reality: number;
}

export interface TopUser {
  uuid: string;
  username: string;
  used_bytes: number;
  data_limit_bytes: number;
  status: string;
}

export interface Alert {
  level: 'danger' | 'warning' | 'info' | 'success';
  message: string;
}

export interface ServiceStatus {
  singBox: 'active' | 'inactive' | 'failed';
  backend: 'active' | 'inactive' | 'failed';
}

export interface SystemOverviewStats {
  version: string;
  serverStatus: 'online' | 'offline' | 'degraded';
  services: ServiceStatus;
  memory: MemoryStats;
  disk: DiskStats;
  cpu: CpuStats;
  network: NetworkStats;
  system: SystemInfo;
  users: UserStats;
  topUsers: TopUser[];
  protocolDistribution: ProtocolDistribution;
  mostUsedProtocol: string;
  alerts: Alert[];
}

// ==--------------------------------------------------------------------------
// User Types
// ==--------------------------------------------------------------------------

export interface UserProtocol {
  protocol_type: 'hysteria2' | 'tuic' | 'vless_reality';
  is_enabled: number; // 0 or 1
}

export interface VpnUser {
  id: string;
  username: string;
  uuid: string;
  status: 'active' | 'disabled' | 'expired';
  data_limit_bytes: number;
  used_bytes: number;
  expire_at: string | null;
  created_at: string;
  protocols: UserProtocol[];
  subscriptionToken: string;
  activeProtocol?: string;
}

export interface CreateUserPayload {
  username: string;
  dataLimitBytes?: number;
  expireAt?: string | null;
  protocols?: string[];
}

export interface UpdateUserPayload {
  dataLimitBytes?: number;
  status?: 'active' | 'disabled';
  protocols?: string[];
  expireAt?: string | null;
}

// ==--------------------------------------------------------------------------
// Auth Types
// ==--------------------------------------------------------------------------

export interface AdminUser {
  id: string;
  username: string;
  role: string;
}

export interface AuthState {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  checked: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

// ==--------------------------------------------------------------------------
// Notification Types
// ==--------------------------------------------------------------------------

export type NotificationType = 'info' | 'warning' | 'error' | 'success';

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// ==--------------------------------------------------------------------------
// Toast Types
// ==--------------------------------------------------------------------------

export interface Toast {
  id: number;
  type: NotificationType;
  message: string;
}

// ==--------------------------------------------------------------------------
// Update Progress Types
// ==--------------------------------------------------------------------------

export interface UpdateProgress {
  active: boolean;
  step: number;
  progressPercent: number;
  message: string;
  error: string | null;
  startTime: string | null;
  completedAt: string | null;
}

// ==--------------------------------------------------------------------------
// REALITY Types
// ==--------------------------------------------------------------------------

export interface RealityDetails {
  publicKey: string;
  shortId: string;
  privateKey?: string; // Never exposed to frontend
}

// ==--------------------------------------------------------------------------
// API Response Types
// ==--------------------------------------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// ==--------------------------------------------------------------------------
// Sort & Filter Types
// ==--------------------------------------------------------------------------

export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
  key: string;
  order: SortOrder;
}

export interface FilterConfig {
  searchQuery: string;
  statusFilter: string;
  protocolFilter: string[];
}

// ==--------------------------------------------------------------------------
// Chart Types
// ==--------------------------------------------------------------------------

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string | string[];
    borderColor: string | string[];
    borderWidth: number;
  }[];
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins?: any;
  scales?: any;
}
