// Project Amnion 2.0 - Format Composables

export function useFormat() {
  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function formatSpeed(bytesPerSec: number): string {
    if (bytesPerSec === 0) return '0 B/s';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytesPerSec) / Math.log(k));
    return parseFloat((bytesPerSec / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}u ${mins}m`;
  }

  function formatTimeAgo(date: Date | string): string {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const seconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s geleden`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m geleden`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}u geleden`;
    const days = Math.floor(hours / 24);
    return `${days}d geleden`;
  }

  return { formatBytes, formatSpeed, formatUptime, formatTimeAgo };
}
