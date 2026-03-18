/**
 * Mock profile connections for demo member profiles.
 * Maps member slug → array of connected member slugs.
 * Used to pre-populate the Connections section on demo profiles.
 */
export const MOCK_PROFILE_CONNECTIONS: Record<string, string[]> = {
  'juan-villegas': [
    'jennifer-walsh',
    'sophia-chen',
    'rachel-green',
    'ashley-johnson',
  ],
};
