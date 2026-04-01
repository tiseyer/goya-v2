import type { BrandColors, RoleColors } from './types';

export const DEFAULT_BRAND_COLORS: BrandColors = {
  primary: '#345c83',
  accent: '#831618',
  background: '#ffffff',
  surface: '#ffffff',
  border: '#e2e8f0',
  foreground: '#1e293b',
};

export const DEFAULT_ROLE_COLORS: RoleColors = {
  student: '#6366f1',     // indigo
  teacher: '#345c83',     // GOYA primary blue
  wellness: '#059669',    // emerald
  school: '#d97706',      // amber
  moderator: '#7c3aed',   // violet
  admin: '#dc2626',       // red
};

export const DEFAULT_MAINTENANCE_COLOR = '#F59E0B'; // amber

// CSS variable name mappings
export const BRAND_CSS_VARS: Record<keyof BrandColors, string> = {
  primary: '--color-primary',
  accent: '--color-accent',
  background: '--color-bg',
  surface: '--color-surface',
  border: '--color-border',
  foreground: '--color-foreground',
};

export const ROLE_CSS_VARS: Record<keyof RoleColors, string> = {
  student: '--color-student',
  teacher: '--color-teacher',
  wellness: '--color-wellness',
  school: '--color-school',
  moderator: '--color-moderator',
  admin: '--color-admin',
};

export const MAINTENANCE_CSS_VAR = '--color-maintenance';
