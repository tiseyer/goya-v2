import type { BrandColors, RoleColors } from './types';

export const DEFAULT_BRAND_COLORS: BrandColors = {
  primary: '#6E88B0',
  accent: '#831618',
  background: '#F2E0D0',
  surface: '#f8efe6',
  border: '#dccfc5',
  foreground: '#2c2420',
};

export const DEFAULT_ROLE_COLORS: RoleColors = {
  student: '#6366f1',     // indigo
  teacher: '#6E88B0',     // GOYA Blue Mirage
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
