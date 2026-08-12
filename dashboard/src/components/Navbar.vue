<template>
  <nav class="navbar">
    <!-- Mobile Menu Backdrop -->
    <div
      v-if="showMobileMenu"
      @click="showMobileMenu = false"
      class="fixed inset-0 top-16 bg-black/60 z-40 md:hidden"
    ></div>

    <div class="navbar-container">
      <!-- Brand -->
      <router-link to="/" class="nav-brand group">
        <AmnionLogo :size="38" />
        <div class="brand-text">
          <div class="brand-title">
            AMNION <span class="text-gradient">2.0</span>
          </div>
          <div class="brand-subtitle">
            VPN BEHEERPANEEL
          </div>
        </div>
      </router-link>

      <!-- Desktop Navigation -->
      <div class="nav-menu-desktop" v-if="authStore.isAuthenticated">
        <div class="nav-items">
          <router-link
            v-for="item in navItems"
            :key="item.name"
            :to="item.path"
            class="nav-item"
            :class="{ 'active': $route.name === item.name }"
            :data-tooltip="item.tooltip"
          >
            <component :is="item.icon" class="nav-icon" />
            <span>{{ item.label }}</span>
          </router-link>
        </div>

        <!-- Right Side Items -->
        <div class="nav-right">
          <!-- Server Status -->
          <div
            class="server-status"
            :class="{
              'bg-emerald-500/10 border-emerald-500/20': systemStore.stats?.serverStatus === 'online',
              'bg-amber-500/10 border-amber-500/20': systemStore.stats?.serverStatus === 'degraded',
              'bg-red-500/10 border-red-500/20': systemStore.stats?.serverStatus === 'offline',
            }"
            data-tooltip="Server Status"
          >
            <span
              class="status-dot"
              :class="{
                'bg-emerald-500': systemStore.stats?.serverStatus === 'online',
                'bg-amber-500': systemStore.stats?.serverStatus === 'degraded',
                'bg-red-500': systemStore.stats?.serverStatus === 'offline',
              }"
            ></span>
            <span class="status-text">
              {{ systemStore.stats?.serverStatus === 'online' ? 'Online' : 
                 systemStore.stats?.serverStatus === 'degraded' ? 'Beperkt' : 'Offline' }}
            </span>
          </div>

          <!-- Theme Toggle -->
          <button
            @click="themeStore.toggleTheme()"
            class="theme-toggle group"
            data-tooltip="Wissel thema"
          >
            <SunIcon v-if="themeStore.isDark" class="w-5 h-5" />
            <MoonIcon v-else class="w-5 h-5" />
          </button>

          <!-- Notifications -->
          <button
            @click="toggleNotifications"
            class="notifications-toggle group relative"
            data-tooltip="Notificaties"
          >
            <BellIcon class="w-5 h-5" />
            <span
              v-if="unreadCount > 0"
              class="notification-badge"
            >
              {{ unreadCount > 9 ? '9+' : unreadCount }}
            </span>
            
            <!-- Notifications Dropdown -->
            <div
              v-if="showNotifications"
              @click.stop
              class="notifications-dropdown"
            >
              <div class="notifications-header">
                <h4 class="text-sm font-bold text-white">Notificaties</h4>
                <button
                  @click="clearNotifications"
                  class="text-xs text-text-muted hover:text-white transition-colors"
                >
                  Alles leegmaken
                </button>
              </div>
              <div class="notifications-list max-h-80 overflow-y-auto">
                <div
                  v-for="notification in notificationStore.notifications"
                  :key="notification.id"
                  class="notification-item"
                  :class="{ 'bg-slate-800/50': !notification.read }"
                  @click="markAsRead(notification.id)"
                >
                  <div
                    class="notification-icon"
                    :class="{
                      'bg-emerald-500/20 text-emerald-500': notification.type === 'success',
                      'bg-red-500/20 text-red-500': notification.type === 'error',
                      'bg-amber-500/20 text-amber-500': notification.type === 'warning',
                      'bg-cyan-500/20 text-cyan-500': notification.type === 'info',
                    }"
                  >
                    <span>
                      {{ notification.type === 'success' ? '✓' : 
                         notification.type === 'error' ? '✗' : 
                         notification.type === 'warning' ? '⚠' : 'ℹ' }}
                    </span>
                  </div>
                  <div class="notification-content">
                    <div class="notification-title text-sm font-semibold text-white">
                      {{ notification.title }}
                    </div>
                    <div class="notification-message text-xs text-text-muted">
                      {{ notification.message }}
                    </div>
                    <div class="notification-time text-xs text-text-dim">
                      {{ formatTimeAgo(notification.timestamp) }}
                    </div>
                  </div>
                </div>
                <div
                  v-if="notificationStore.notifications.length === 0"
                  class="text-center py-4 text-sm text-text-muted"
                >
                  Geen notificaties
                </div>
              </div>
            </div>
          </button>

          <!-- Logout Button -->
          <button
            @click="handleLogout"
            class="nav-item btn-logout"
            data-tooltip="Uitloggen"
          >
            <LogoutIcon class="w-4 h-4" />
            <span class="hidden md:inline">Uitloggen</span>
          </button>
        </div>
      </div>

      <!-- Mobile Menu Button -->
      <button
        v-if="authStore.isAuthenticated"
        @click="showMobileMenu = !showMobileMenu"
        class="mobile-menu-btn md:hidden"
      >
        <MenuIcon class="w-6 h-6" />
      </button>

      <!-- Mobile Navigation -->
      <transition name="slide-down">
        <div
          v-if="showMobileMenu && authStore.isAuthenticated"
          class="nav-menu-mobile md:hidden"
        >
          <div class="mobile-nav-items">
            <router-link
              v-for="item in navItems"
              :key="item.name"
              :to="item.path"
              class="mobile-nav-item"
              @click="showMobileMenu = false"
            >
              <component :is="item.icon" class="w-5 h-5" />
              <span>{{ item.label }}</span>
            </router-link>
          </div>
          
          <div class="mobile-nav-footer">
            <button
              @click="handleLogout"
              class="mobile-nav-item text-red-400"
            >
              <LogoutIcon class="w-5 h-5" />
              <span>Uitloggen</span>
            </button>
          </div>
        </div>
      </transition>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useSystemStore } from '../stores/system';
import { useThemeStore } from '../stores/theme';
import { useNotificationStore } from '../stores/notifications';
import AmnionLogo from './AmnionLogo.vue';
import {
  HomeIcon,
  UsersIcon,
  ChartBarIcon,
  ClipboardListIcon,
  CogIcon,
  LogoutIcon,
  MenuIcon,
  SunIcon,
  MoonIcon,
  BellIcon,
} from './Icons';

const router = useRouter();
const authStore = useAuthStore();
const systemStore = useSystemStore();
const themeStore = useThemeStore();
const notificationStore = useNotificationStore();

const showMobileMenu = ref(false);
const showNotifications = ref(false);

const navItems = [
  { name: 'overview', path: '/', label: 'Overzicht', icon: HomeIcon, tooltip: 'Dashboard Overzicht' },
  { name: 'users', path: '/users', label: 'Gebruikers', icon: UsersIcon, tooltip: 'Gebruikersbeheer' },
  { name: 'analytics', path: '/analytics', label: 'Analyses', icon: ChartBarIcon, tooltip: 'Netwerkstatistieken' },
  { name: 'logs', path: '/logs', label: 'Logboeken', icon: ClipboardListIcon, tooltip: 'Systeem Logs' },
  { name: 'settings', path: '/settings', label: 'Instellingen', icon: CogIcon, tooltip: 'Systeem Instellingen' },
];

const unreadCount = computed(() => {
  return notificationStore.notifications.filter(n => !n.read).length;
});

function toggleNotifications() {
  showNotifications.value = !showNotifications.value;
}

function markAsRead(id: number) {
  notificationStore.markAsRead(id);
}

function clearNotifications() {
  notificationStore.clearNotifications();
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s geleden`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m geleden`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}u geleden`;
  const days = Math.floor(hours / 24);
  return `${days}d geleden`;
}

async function handleLogout() {
  await authStore.logout();
  router.push({ name: 'login' });
}

// Close mobile menu on route change
onMounted(() => {
  router.afterEach(() => {
    showMobileMenu.value = false;
    showNotifications.value = false;
  });
});

// Close dropdowns on outside click
onUnmounted(() => {
  window.removeEventListener('click', () => {});
});
</script>

<style scoped>
/* Navbar Container */
.navbar {
  @apply sticky top-0 z-50;
}

.navbar-container {
  @apply bg-slate-900/80 backdrop-blur-xl border-b border-slate-800;
  @apply px-4 sm:px-6 lg:px-8 py-3;
  @apply flex items-center justify-between;
  @apply max-w-full mx-auto;
  @apply relative z-50;
}

/* Brand */
.nav-brand {
  @apply flex items-center gap-3 flex-shrink-0;
}

.brand-text {
  @apply flex flex-col;
}

.brand-title {
  @apply text-lg font-extrabold text-white;
}

.brand-subtitle {
  @apply text-[10px] text-text-muted uppercase tracking-wider font-semibold;
}

/* Desktop Navigation */
.nav-menu-desktop {
  @apply hidden md:flex items-center gap-2;
}

.nav-items {
  @apply flex items-center gap-1;
}

.nav-item {
  @apply flex items-center gap-2 px-4 py-2 rounded-xl;
  @apply text-sm font-medium text-text-muted;
  @apply transition-all duration-200;
  @apply hover:bg-slate-800/50 hover:text-white;
}

.nav-item.active {
  @apply bg-primary-500/10 text-primary-500 border border-primary-500/20;
}

.nav-icon {
  @apply w-4 h-4 flex-shrink-0;
}

/* Right Side */
.nav-right {
  @apply flex items-center gap-2;
}

/* Server Status */
.server-status {
  @apply flex items-center gap-2 px-3 py-2 rounded-xl;
  @apply text-xs font-semibold;
  @apply transition-all duration-200;
}

.status-dot {
  @apply w-2 h-2 rounded-full;
}

.status-text {
  @apply text-nowrap;
}

/* Theme Toggle */
.theme-toggle {
  @apply p-2 rounded-xl;
  @apply text-text-muted;
  @apply transition-all duration-200;
  @apply hover:bg-slate-800/50 hover:text-primary-500;
}

/* Notifications Toggle */
.notifications-toggle {
  @apply p-2 rounded-xl relative;
  @apply text-text-muted;
  @apply transition-all duration-200;
  @apply hover:bg-slate-800/50 hover:text-cyan-400;
}

.notification-badge {
  @apply absolute top-1 right-1;
  @apply text-[10px] font-bold;
  @apply bg-red-500 text-white;
  @apply px-1.5 py-0.5 rounded-full;
}

/* Notifications Dropdown */
.notifications-dropdown {
  @apply absolute top-full right-0 mt-2;
  @apply w-80;
  @apply bg-slate-900/95 backdrop-blur-xl;
  @apply border border-slate-800;
  @apply rounded-2xl;
  @apply shadow-2xl;
  @apply z-50;
}

.notifications-header {
  @apply flex items-center justify-between p-4;
  @apply border-b border-slate-800;
}

.notifications-list {
  @apply p-2;
}

.notification-item {
  @apply flex items-start gap-3 p-3;
  @apply rounded-xl;
  @apply cursor-pointer;
  @apply transition-all duration-200;
  @apply hover:bg-slate-800/50;
}

.notification-icon {
  @apply w-8 h-8 rounded-full;
  @apply flex items-center justify-center;
  @apply text-sm font-bold;
  @apply flex-shrink-0;
}

.notification-content {
  @apply flex-1 min-w-0;
}

.notification-title {
  @apply mb-1;
}

.notification-message {
  @apply mb-1;
}

.notification-time {
  @apply text-right;
}

/* Logout Button */
.btn-logout {
  @apply text-red-400;
  @apply hover:text-red-300;
  @apply hover:bg-red-500/10;
}

/* Mobile Menu Button */
.mobile-menu-btn {
  @apply md:hidden;
  @apply p-2 rounded-xl;
  @apply text-text-muted;
  @apply transition-all duration-200;
  @apply hover:bg-slate-800/50 hover:text-white;
}

/* Mobile Navigation */
.nav-menu-mobile {
  @apply fixed top-16 left-0 right-0;
  @apply bg-slate-900 shadow-2xl;
  @apply border-b border-slate-800;
  @apply z-50;
  @apply flex flex-col;
}

.mobile-nav-items {
  @apply flex flex-col gap-1 p-4;
}

.mobile-nav-item {
  @apply flex items-center gap-3 px-4 py-3;
  @apply text-text-muted;
  @apply transition-all duration-200;
  @apply hover:bg-slate-800/50 hover:text-white;
}

.mobile-nav-footer {
  @apply p-4 border-t border-slate-800;
}

/* Slide Down Transition */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Tooltip */
[data-tooltip] {
  position: relative;
}

[data-tooltip]::after {
  content: attr(data-tooltip);
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  
  @apply bg-slate-900 text-white;
  @apply text-xs font-medium;
  @apply px-2 py-1 rounded;
  @apply whitespace-nowrap;
  @apply opacity-0 invisible;
  @apply transition-all duration-200;
  @apply z-50;
  
  margin-top: 8px;
}

[data-tooltip]:hover::after {
  opacity: 1;
  visibility: visible;
}

@media (max-width: 768px) {
  [data-tooltip]::after {
    display: none !important;
  }
}

/* Light Mode Overrides */
.light .navbar-container {
  @apply bg-white/80 border-slate-200;
}

.light .brand-title {
  @apply text-slate-900;
}

.light .nav-item {
  @apply text-slate-600 hover:bg-slate-100 hover:text-slate-900;
}

.light .nav-menu-mobile {
  @apply bg-white border-slate-200;
}

.light .mobile-nav-item {
  @apply text-slate-600 hover:bg-slate-100 hover:text-slate-900;
}

.light .notifications-dropdown {
  @apply bg-white border-slate-200 shadow-xl;
}

.light .notifications-header {
  @apply border-slate-200;
}

.light .notifications-header h4 {
  @apply text-slate-900;
}

.light .notification-title {
  @apply text-slate-900;
}

.light [data-tooltip]::after {
  @apply bg-slate-900 border border-slate-700 shadow-xl;
  color: #ffffff !important;
}
</style>
