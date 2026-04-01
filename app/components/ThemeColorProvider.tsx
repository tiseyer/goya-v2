import {
  DEFAULT_BRAND_COLORS,
  DEFAULT_ROLE_COLORS,
  DEFAULT_MAINTENANCE_COLOR,
  BRAND_CSS_VARS,
  ROLE_CSS_VARS,
  MAINTENANCE_CSS_VAR,
} from '@/lib/theme/defaults';
import type { BrandColors, RoleColors } from '@/lib/theme/types';

/**
 * ThemeColorProvider — React Server Component
 *
 * Fetches brand_colors, role_colors, and maintenance_indicator_color from
 * site_settings and injects them as CSS custom properties on :root via a
 * <style> tag. Falls back to defaults from lib/theme/defaults.ts when the
 * DB is unreachable or no overrides have been saved.
 *
 * Place this component inside <html> before <body> in the root layout.
 */
export default async function ThemeColorProvider() {
  let brandColors: BrandColors = { ...DEFAULT_BRAND_COLORS };
  let roleColors: RoleColors = { ...DEFAULT_ROLE_COLORS };
  let maintenanceColor: string = DEFAULT_MAINTENANCE_COLOR;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const url = `${supabaseUrl}/rest/v1/site_settings?key=in.(brand_colors,role_colors,maintenance_indicator_color)&select=key,value`;
      const res = await fetch(url, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        cache: 'no-store',
      });

      if (res.ok) {
        const rows = (await res.json()) as Array<{ key: string; value: string }>;
        const map: Record<string, string> = {};
        rows.forEach(r => { map[r.key] = r.value ?? ''; });

        if (map.brand_colors) {
          try {
            const parsed = JSON.parse(map.brand_colors) as Partial<BrandColors>;
            brandColors = { ...DEFAULT_BRAND_COLORS, ...parsed };
          } catch {
            // malformed JSON — keep defaults
          }
        }

        if (map.role_colors) {
          try {
            const parsed = JSON.parse(map.role_colors) as Partial<RoleColors>;
            roleColors = { ...DEFAULT_ROLE_COLORS, ...parsed };
          } catch {
            // malformed JSON — keep defaults
          }
        }

        if (map.maintenance_indicator_color) {
          maintenanceColor = map.maintenance_indicator_color;
        }
      }
    }
  } catch {
    // DB unreachable or env vars missing — fall back to defaults silently
  }

  // Build the :root CSS block from all merged values
  const cssLines: string[] = [':root {'];

  for (const [key, cssVar] of Object.entries(BRAND_CSS_VARS)) {
    cssLines.push(`  ${cssVar}: ${brandColors[key as keyof BrandColors]};`);
  }

  for (const [key, cssVar] of Object.entries(ROLE_CSS_VARS)) {
    cssLines.push(`  ${cssVar}: ${roleColors[key as keyof RoleColors]};`);
  }

  cssLines.push(`  ${MAINTENANCE_CSS_VAR}: ${maintenanceColor};`);
  cssLines.push('}');

  const cssContent = cssLines.join('\n');

  return (
    <style
      dangerouslySetInnerHTML={{ __html: cssContent }}
    />
  );
}
