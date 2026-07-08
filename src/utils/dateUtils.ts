/**
 * Utility functions for Event Expiry (at end of event day) & Formatting
 */

/**
 * Check if an event or ad has expired (when the event date day has ended)
 */
export function isEventExpired(eventDateStr: string): boolean {
  try {
    if (!eventDateStr) return false;
    const eventTime = new Date(eventDateStr);
    const endOfDay = new Date(eventTime.getFullYear(), eventTime.getMonth(), eventTime.getDate(), 23, 59, 59, 999).getTime();
    return Date.now() > endOfDay;
  } catch (e) {
    return false;
  }
}

/**
 * Legacy compatibility alias
 */
export function isExpired15Days(dateStr: string): boolean {
  return isEventExpired(dateStr);
}

/**
 * Get remaining days/hours before the event day ends (expiry)
 */
export function getDaysRemainingBeforeExpiry(eventDateStr: string): { days: number; hours: number; isExpired: boolean; progressPercent: number } {
  try {
    if (!eventDateStr) {
      return { days: 0, hours: 0, isExpired: false, progressPercent: 0 };
    }
    const eventTime = new Date(eventDateStr);
    const endOfDay = new Date(eventTime.getFullYear(), eventTime.getMonth(), eventTime.getDate(), 23, 59, 59, 999).getTime();
    const now = Date.now();
    const remainingMs = endOfDay - now;

    if (remainingMs <= 0) {
      return { days: 0, hours: 0, isExpired: true, progressPercent: 100 };
    }

    const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return { days, hours, isExpired: false, progressPercent: 0 };
  } catch (e) {
    return { days: 0, hours: 0, isExpired: false, progressPercent: 0 };
  }
}

/**
 * Format event date nicely in Arabic or English
 */
export function formatDate(dateStr: string, lang: 'ar' | 'en'): string {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  } catch (e) {
    return dateStr;
  }
}

/**
 * Format time in Arabic or English
 */
export function formatTime(dateStr: string, lang: 'ar' | 'en'): string {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  } catch (e) {
    return '';
  }
}

/**
 * Format relative time (e.g. "منذ ساعتين", "2 hours ago")
 */
export function formatRelativeTime(dateStr: string, lang: 'ar' | 'en'): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (lang === 'ar') {
      if (diffDays > 0) return `منذ ${diffDays} يوم`;
      if (diffHours > 0) return `منذ ${diffHours} ساعة`;
      if (diffMinutes > 0) return `منذ ${diffMinutes} دقيقة`;
      return 'الآن';
    } else {
      if (diffDays > 0) return `${diffDays}d ago`;
      if (diffHours > 0) return `${diffHours}h ago`;
      if (diffMinutes > 0) return `${diffMinutes}m ago`;
      return 'Just now';
    }
  } catch (e) {
    return dateStr;
  }
}
