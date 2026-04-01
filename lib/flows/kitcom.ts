import 'server-only';

/**
 * Tag a subscriber in Kit.com (formerly ConvertKit).
 * Returns a graceful fallback if KITCOM_API_KEY is not configured.
 */
export async function tagSubscriber(
  email: string,
  tagId: string
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.KITCOM_API_KEY;

  if (!apiKey) {
    return { success: false, error: 'KITCOM_API_KEY not configured' };
  }

  try {
    const response = await fetch(`https://api.kit.com/v4/tags/${tagId}/subscribers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ email_address: email }),
    });

    if (response.ok) {
      return { success: true };
    }

    return { success: false, error: response.statusText };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
