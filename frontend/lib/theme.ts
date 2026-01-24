/**
 * SolanaHunter Design System
 * Central theme configuration for consistent styling
 */

// Grade Colors
export const gradeColors = {
  'S+': {
    bg: 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500',
    text: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-500',
    glow: 'shadow-glow shadow-yellow-500/50',
    badge: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white',
  },
  'S': {
    bg: 'bg-gradient-to-r from-purple-500 to-pink-500',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500',
    glow: 'shadow-glow shadow-purple-500/50',
    badge: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
  },
  'A+': {
    bg: 'bg-gradient-to-r from-blue-500 to-indigo-500',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500',
    glow: 'shadow-glow shadow-blue-500/50',
    badge: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white',
  },
  'A': {
    bg: 'bg-gradient-to-r from-green-500 to-emerald-500',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-500',
    glow: 'shadow-glow shadow-green-500/50',
    badge: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
  },
  'B+': {
    bg: 'bg-gradient-to-r from-teal-500 to-cyan-500',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-500',
    glow: 'shadow-glow shadow-teal-500/50',
    badge: 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white',
  },
  'B': {
    bg: 'bg-gradient-to-r from-cyan-500 to-blue-400',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-500',
    glow: 'shadow-glow shadow-cyan-500/50',
    badge: 'bg-gradient-to-r from-cyan-500 to-blue-400 text-white',
  },
  'C+': {
    bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500',
    glow: 'shadow-glow shadow-amber-500/50',
    badge: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
  },
  'C': {
    bg: 'bg-gradient-to-r from-orange-500 to-red-500',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-500',
    glow: 'shadow-glow shadow-orange-500/50',
    badge: 'bg-gradient-to-r from-orange-500 to-red-500 text-white',
  },
  'F': {
    bg: 'bg-gradient-to-r from-red-500 to-rose-600',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-500',
    glow: 'shadow-glow shadow-red-500/50',
    badge: 'bg-gradient-to-r from-red-500 to-rose-600 text-white',
  },
} as const;

// Category Colors
export const categoryColors = {
  'LEGENDARY': {
    bg: 'bg-gradient-to-r from-purple-600 via-pink-600 to-red-600',
    text: 'text-purple-600 dark:text-purple-400',
    badge: 'bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white',
    icon: '👑',
  },
  'EXCELLENT': {
    bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
    text: 'text-green-600 dark:text-green-400',
    badge: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white',
    icon: '⭐',
  },
  'GOOD': {
    bg: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    text: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
    icon: '✨',
  },
  'FAIR': {
    bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
    text: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
    icon: '⚠️',
  },
  'POOR': {
    bg: 'bg-gradient-to-r from-red-500 to-rose-600',
    text: 'text-red-600 dark:text-red-400',
    badge: 'bg-gradient-to-r from-red-500 to-rose-600 text-white',
    icon: '❌',
  },
} as const;

// Status Colors
export const statusColors = {
  'SUCCESS': {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-600 dark:text-green-400',
    badge: 'bg-green-500 text-white',
    icon: '✅',
  },
  'FAILURE': {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-500 text-white',
    icon: '❌',
  },
  'ACTIVE': {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-500 text-white',
    icon: '🔵',
  },
  'EXPIRED': {
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    text: 'text-gray-600 dark:text-gray-400',
    badge: 'bg-gray-500 text-white',
    icon: '⏱️',
  },
} as const;

// Score Component Colors
export const scoreComponentColors = {
  safety: {
    color: '#3b82f6', // blue-500
    lightColor: '#60a5fa', // blue-400
    darkColor: '#2563eb', // blue-600
    icon: '🛡️',
    label: 'Safety',
  },
  holder: {
    color: '#8b5cf6', // purple-500
    lightColor: '#a78bfa', // purple-400
    darkColor: '#7c3aed', // purple-600
    icon: '👥',
    label: 'Holders',
  },
  liquidity: {
    color: '#10b981', // green-500
    lightColor: '#34d399', // green-400
    darkColor: '#059669', // green-600
    icon: '💧',
    label: 'Liquidity',
  },
  volume: {
    color: '#f59e0b', // amber-500
    lightColor: '#fbbf24', // amber-400
    darkColor: '#d97706', // amber-600
    icon: '📊',
    label: 'Volume',
  },
  smartMoney: {
    color: '#ec4899', // pink-500
    lightColor: '#f472b6', // pink-400
    darkColor: '#db2777', // pink-600
    icon: '🤖',
    label: 'Smart Money',
  },
  priceAction: {
    color: '#ef4444', // red-500
    lightColor: '#f87171', // red-400
    darkColor: '#dc2626', // red-600
    icon: '📈',
    label: 'Price Action',
  },
} as const;

// Helper Functions
export const getGradeColor = (grade: string) => {
  return gradeColors[grade as keyof typeof gradeColors] || gradeColors['F'];
};

export const getCategoryColor = (category: string) => {
  return categoryColors[category as keyof typeof categoryColors] || categoryColors['POOR'];
};

export const getStatusColor = (status: string) => {
  return statusColors[status as keyof typeof statusColors] || statusColors['ACTIVE'];
};

export const getScoreColor = (score: number): string => {
  if (score >= 95) return 'text-purple-600 dark:text-purple-400';
  if (score >= 85) return 'text-green-600 dark:text-green-400';
  if (score >= 75) return 'text-blue-600 dark:text-blue-400';
  if (score >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
};

export const getScoreGradient = (score: number): string => {
  if (score >= 95) return 'from-purple-500 to-pink-500';
  if (score >= 85) return 'from-green-500 to-emerald-600';
  if (score >= 75) return 'from-blue-500 to-indigo-500';
  if (score >= 60) return 'from-amber-500 to-orange-500';
  return 'from-red-500 to-rose-600';
};

// Trust Score Colors
export const getTrustScoreColor = (score: number): string => {
  if (score >= 80) return '#10b981'; // green
  if (score >= 60) return '#3b82f6'; // blue
  if (score >= 40) return '#f59e0b'; // amber
  return '#ef4444'; // red
};

// ROI Colors
export const getROIColor = (roi: number): string => {
  if (roi >= 50) return 'text-green-600 dark:text-green-400 font-bold';
  if (roi >= 0) return 'text-green-600 dark:text-green-400';
  if (roi >= -20) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400 font-bold';
};

// Liquidity Status
export const getLiquidityStatus = (liquiditySol: number) => {
  if (liquiditySol >= 100) return { label: 'Excellent', color: 'green', icon: '💎' };
  if (liquiditySol >= 50) return { label: 'High', color: 'blue', icon: '💧' };
  if (liquiditySol >= 20) return { label: 'Medium', color: 'amber', icon: '⚠️' };
  if (liquiditySol >= 10) return { label: 'Low', color: 'orange', icon: '🔻' };
  return { label: 'Very Low', color: 'red', icon: '❌' };
};

// Volume Status
export const getVolumeStatus = (volume24h: number) => {
  if (volume24h >= 500000) return { label: 'Very High', color: 'purple' };
  if (volume24h >= 100000) return { label: 'High', color: 'green' };
  if (volume24h >= 50000) return { label: 'Good', color: 'blue' };
  if (volume24h >= 10000) return { label: 'Fair', color: 'amber' };
  return { label: 'Low', color: 'red' };
};

// Badge Styles
export const getBadgeClasses = (type: 'success' | 'warning' | 'danger' | 'info' | 'purple') => {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  
  const variants = {
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  };
  
  return `${baseClasses} ${variants[type]}`;
};

// Achievements & Badges
export const achievements = {
  earlyBird: {
    name: 'Early Bird',
    description: 'First to buy a successful token',
    icon: '🐦',
    color: 'bg-gradient-to-r from-yellow-400 to-orange-500',
  },
  diamondHands: {
    name: 'Diamond Hands',
    description: 'Hold token for 30+ days',
    icon: '💎',
    color: 'bg-gradient-to-r from-blue-400 to-purple-500',
  },
  whaleHunter: {
    name: 'Whale Hunter',
    description: 'Profit over $1M on a single token',
    icon: '🐋',
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
  },
  perfectWeek: {
    name: 'Perfect Week',
    description: '7 days with 100% success rate',
    icon: '🔥',
    color: 'bg-gradient-to-r from-red-500 to-orange-500',
  },
  volumeKing: {
    name: 'Volume King',
    description: 'Most trades in a month',
    icon: '👑',
    color: 'bg-gradient-to-r from-yellow-500 to-amber-600',
  },
} as const;

export default {
  gradeColors,
  categoryColors,
  statusColors,
  scoreComponentColors,
  getGradeColor,
  getCategoryColor,
  getStatusColor,
  getScoreColor,
  getScoreGradient,
  getTrustScoreColor,
  getROIColor,
  getLiquidityStatus,
  getVolumeStatus,
  getBadgeClasses,
  achievements,
};