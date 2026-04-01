import 'server-only'
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

// ─── Types ──────────────────────────────────────────────────────────────────

interface VercelDeploymentMeta {
  githubCommitRef?: string
  githubCommitMessage?: string
  githubCommitSha?: string
  [key: string]: unknown
}

interface VercelDeployment {
  uid: string
  url: string
  created: number
  meta?: VercelDeploymentMeta
  [key: string]: unknown
}

interface VercelDeploymentsResponse {
  deployments?: VercelDeployment[]
  [key: string]: unknown
}

export interface Deployment {
  url: string
  branch: string
  commitMessage: string
  commitSha: string
  createdAt: string
  isCurrent: boolean
  target: 'production' | 'preview'
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function GET() {
  // Auth check
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'moderator'].includes(profile.role as string)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Check env vars
  const accessToken = process.env.VERCEL_ACCESS_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID

  if (!accessToken || !projectId) {
    return NextResponse.json(
      { error: 'Deployments not configured' },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      }
    )
  }

  const currentSha = process.env.VERCEL_GIT_COMMIT_SHA ?? ''
  const currentBranch = process.env.VERCEL_GIT_COMMIT_REF ?? ''
  const currentEnv = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development'

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }

  function mapDeployments(raw: VercelDeployment[], target: 'production' | 'preview'): Deployment[] {
    return raw.map((d) => {
      const sha = d.meta?.githubCommitSha ?? ''
      const url = d.url.startsWith('http') ? d.url : `https://${d.url}`
      return {
        url,
        branch: d.meta?.githubCommitRef ?? 'unknown',
        commitMessage: d.meta?.githubCommitMessage ?? '',
        commitSha: sha,
        createdAt: new Date(d.created).toISOString(),
        isCurrent: Boolean(currentSha && sha && sha === currentSha),
        target,
      }
    })
  }

  try {
    const [previewRes, productionRes] = await Promise.all([
      fetch(
        `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=50&state=READY`,
        { headers }
      ),
      fetch(
        `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=10&state=READY&target=production`,
        { headers }
      ),
    ])

    let previewDeployments: Deployment[] = []
    let productionDeployments: Deployment[] = []

    if (previewRes.ok) {
      const json = (await previewRes.json()) as VercelDeploymentsResponse
      previewDeployments = mapDeployments(json?.deployments ?? [], 'preview')
    } else {
      console.warn('[deployments] Preview fetch non-200:', previewRes.status)
    }

    if (productionRes.ok) {
      const json = (await productionRes.json()) as VercelDeploymentsResponse
      productionDeployments = mapDeployments(json?.deployments ?? [], 'production')
    } else {
      console.warn('[deployments] Production fetch non-200:', productionRes.status)
    }

    if (!previewRes.ok && !productionRes.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch deployments' },
        { status: 502, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    // Merge and deduplicate by commitSha — production takes priority over preview for same SHA
    const merged = new Map<string, Deployment>()

    // Add preview deployments first (lower priority)
    for (const dep of previewDeployments) {
      const key = dep.commitSha || dep.url
      merged.set(key, dep)
    }

    // Add production deployments second (overwrites preview entries for same SHA)
    for (const dep of productionDeployments) {
      const key = dep.commitSha || dep.url
      merged.set(key, dep)
    }

    const deployments = Array.from(merged.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json(
      {
        deployments,
        current: {
          branch: currentBranch,
          commitSha: currentSha,
          environment: currentEnv,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (err) {
    console.error('[deployments] fetch error:', err)
    return NextResponse.json(
      { error: 'Internal error fetching deployments' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
