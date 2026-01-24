/**
 * SolanaHunter Formatters
 * Utility functions for formatting numbers, dates, addresses, etc.
 */

import { formatDistanceToNow, format as dateFnsFormat } from 'date-fns';

/**
 * Format large numbers with K, M, B suffixes
 * @example formatNumber(1234567) => "1.23M"
 */
export const formatNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) return 'N/A';
  
  const absNum = Math.abs(num);
  
  if (absNum >= 1e9) {
    return (num / 1e9).toFixed(2) + 'B';
  }
  if (absNum >= 1e6) {
    return (num / 1e6).toFixed(2) + 'M';
  }
  if (absNum >= 1e3) {
    return (num / 1e3).toFixed(2) + 'K';
  }
  
  return num.toFixed(2);
};

/**
 * Format number with commas
 * @example formatNumberWithCommas(1234567) => "1,234,567"
 */
export const formatNumberWithCommas = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) return 'N/A';
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
};

/**
 * Format price based on value
 * @example formatPrice(0.00001234) => "$0.00001234"
 */
export const formatPrice = (price: number | undefined | null): string => {
  if (price === undefined || price === null || isNaN(price)) return 'N/A';
  
  if (price === 0) return '$0.00';
  
  // For very small prices, show more decimals
  if (price < 0.0001) {
    return '$' + price.toFixed(8);
  }
  
  // For small prices
  if (price < 1) {
    return '$' + price.toFixed(6);
  }
  
  // For normal prices
  if (price < 100) {
    return '$' + price.toFixed(4);
  }
  
  // For large prices
  return '$' + formatNumberWithCommas(price);
};

/**
 * Format percentage
 * @example formatPercent(12.5) => "+12.5%"
 */
export const formatPercent = (percent: number | undefined | null, includeSign: boolean = true): string => {
  if (percent === undefined || percent === null || isNaN(percent)) return 'N/A';
  
  const sign = includeSign && percent > 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}%`;
};

/**
 * Format SOL amount
 * @example formatSOL(45.123456) => "45.12 SOL"
 */
export const formatSOL = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return 'N/A';
  return `${amount.toFixed(2)} SOL`;
};

/**
 * Format wallet address
 * @example formatAddress("Ae7xG9pT8...kL9Bq2Zx3") => "Ae7x...Bq2Z"
 */
export const formatAddress = (address: string | undefined | null, startChars: number = 4, endChars: number = 4): string => {
  if (!address) return 'N/A';
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

/**
 * Format time ago
 * @example formatTimeAgo(date) => "2 minutes ago"
 */
export const formatTimeAgo = (date: string | Date | undefined | null): string => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    return 'Invalid date';
  }
};

/**
 * Format date
 * @example formatDate(date) => "Jan 24, 2026"
 */
export const formatDate = (date: string | Date | undefined | null, formatStr: string = 'MMM dd, yyyy'): string => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateFnsFormat(dateObj, formatStr);
  } catch (error) {
    return 'Invalid date';
  }
};

/**
 * Format date with time
 * @example formatDateTime(date) => "Jan 24, 2026 14:30"
 */
export const formatDateTime = (date: string | Date | undefined | null): string => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateFnsFormat(dateObj, 'MMM dd, yyyy HH:mm');
  } catch (error) {
    return 'Invalid date';
  }
};

/**
 * Format market cap
 * @example formatMarketCap(1234567) => "$1.23M"
 */
export const formatMarketCap = (cap: number | undefined | null): string => {
  if (cap === undefined || cap === null || isNaN(cap)) return 'N/A';
  return '$' + formatNumber(cap);
};

/**
 * Format volume
 * @example formatVolume(1234567) => "$1.23M"
 */
export const formatVolume = (volume: number | undefined | null): string => {
  if (volume === undefined || volume === null || isNaN(volume)) return 'N/A';
  return '$' + formatNumber(volume);
};

/**
 * Get color class for percentage
 * @example getPercentColor(12.5) => "text-green-600"
 */
export const getPercentColor = (percent: number | undefined | null): string => {
  if (percent === undefined || percent === null || isNaN(percent)) return 'text-gray-600';
  
  if (percent > 0) return 'text-green-600 dark:text-green-400';
  if (percent < 0) return 'text-red-600 dark:text-red-400';
  return 'text-gray-600 dark:text-gray-400';
};

/**
 * Get color class for ROI
 * @example getROIColor(50) => "text-green-600 font-bold"
 */
export const getROIColor = (roi: number | undefined | null): string => {
  if (roi === undefined || roi === null || isNaN(roi)) return 'text-gray-600';
  
  if (roi >= 50) return 'text-green-600 dark:text-green-400 font-bold';
  if (roi >= 0) return 'text-green-600 dark:text-green-400';
  if (roi >= -20) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400 font-bold';
};

/**
 * Format score with color
 * @example formatScore(87) => { text: "87/100", color: "text-green-600" }
 */
export const formatScore = (score: number | undefined | null) => {
  if (score === undefined || score === null || isNaN(score)) {
    return { text: 'N/A', color: 'text-gray-600' };
  }
  
  let color = 'text-gray-600';
  if (score >= 95) color = 'text-purple-600 dark:text-purple-400';
  else if (score >= 85) color = 'text-green-600 dark:text-green-400';
  else if (score >= 75) color = 'text-blue-600 dark:text-blue-400';
  else if (score >= 60) color = 'text-amber-600 dark:text-amber-400';
  else color = 'text-red-600 dark:text-red-400';
  
  return {
    text: `${score}/100`,
    color,
  };
};

/**
 * Format holder count
 * @example formatHolderCount(1234) => "1,234 holders"
 */
export const formatHolderCount = (count: number | undefined | null): string => {
  if (count === undefined || count === null || isNaN(count)) return 'N/A';
  return `${formatNumberWithCommas(count)} holder${count !== 1 ? 's' : ''}`;
};

/**
 * Format trust score
 * @example formatTrustScore(85) => "85/100 (Trusted)"
 */
export const formatTrustScore = (score: number | undefined | null): string => {
  if (score === undefined || score === null || isNaN(score)) return 'N/A';
  
  let label = 'Unknown';
  if (score >= 80) label = 'Highly Trusted';
  else if (score >= 60) label = 'Trusted';
  else if (score >= 40) label = 'Neutral';
  else label = 'Risky';
  
  return `${score}/100 (${label})`;
};

/**
 * Get emoji for score
 * @example getScoreEmoji(87) => "🔥"
 */
export const getScoreEmoji = (score: number | undefined | null): string => {
  if (score === undefined || score === null || isNaN(score)) return '❓';
  
  if (score >= 95) return '👑';
  if (score >= 85) return '🔥';
  if (score >= 75) return '⭐';
  if (score >= 60) return '✨';
  return '❌';
};

/**
 * Format duration (seconds to human readable)
 * @example formatDuration(3665) => "1h 1m"
 */
export const formatDuration = (seconds: number | undefined | null): string => {
  if (seconds === undefined || seconds === null || isNaN(seconds)) return 'N/A';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
};

/**
 * Truncate text
 * @example truncateText("Long text here", 10) => "Long text..."
 */
export const truncateText = (text: string | undefined | null, maxLength: number = 50): string => {
  if (!text) return 'N/A';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Copy to clipboard helper
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
};

/**
 * Format file size
 * @example formatFileSize(1234567) => "1.18 MB"
 */
export const formatFileSize = (bytes: number | undefined | null): string => {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return 'N/A';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
};

export default {
  formatNumber,
  formatNumberWithCommas,
  formatPrice,
  formatPercent,
  formatSOL,
  formatAddress,
  formatTimeAgo,
  formatDate,
  formatDateTime,
  formatMarketCap,
  formatVolume,
  getPercentColor,
  getROIColor,
  formatScore,
  formatHolderCount,
  formatTrustScore,
  getScoreEmoji,
  formatDuration,
  truncateText,
  copyToClipboard,
  formatFileSize,
};
