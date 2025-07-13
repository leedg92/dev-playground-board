const KST_OFFSET = 9 * 60 * 60 * 1000;

export const getKSTTime = (date: Date | null = null): Date => {
  const now = date ?? new Date();
  return new Date(now.getTime() + KST_OFFSET);
};

export const formatKSTISO = (date: Date | null = null): string => {
  const kstTime = getKSTTime(date);
  return kstTime.toISOString().replace('Z', '+09:00');
};

export const formatKSTLocale = (date: Date | null = null): string => {
  const kstTime = getKSTTime(date);
  return kstTime.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\. /g, '-').replace(/\./g, '').replace(', ', ' ');
};

export const formatKSTDate = (date: Date | null = null): string => {
  const kstTime = getKSTTime(date);
  return kstTime.toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul'
  });
};

export const formatKSTTime = (date: Date | null = null): string => {
  const kstTime = getKSTTime(date);
  return kstTime.toLocaleTimeString('ko-KR', {
    timeZone: 'Asia/Seoul'
  });
};

export const getKSTHour = (date: Date | null = null): number => {
  const kstTime = getKSTTime(date);
  return kstTime.getHours();
};

export const getLogTimestamp = (): string => {
  return `,"timestamp":"${formatKSTISO()}"`;
};

export const formatUptime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}시간 ${minutes}분 ${secs}초`;
  } else if (minutes > 0) {
    return `${minutes}분 ${secs}초`;
  } else {
    return `${secs}초`;
  }
};

export const formatDuration = (milliseconds: number): string => {
  if (milliseconds >= 1000) {
    return `${(milliseconds / 1000).toFixed(1)}초`;
  } else {
    return `${Math.round(milliseconds)}ms`;
  }
};

export function formatDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

/**
 * 최근 3일 + 최근 7일 범위 반환
 * @returns 
 */
export function getPeriodRangeKST(): { startDate: string; endDate: string } {
  const today = getKSTTime();
  const start = new Date(today);
  start.setDate(today.getDate() - 3);
  const end = new Date(today);
  end.setDate(today.getDate() + 7);
  return {
    startDate: formatDate(start),
    endDate: formatDate(end)
  };
}