import { NextRequest, NextResponse } from 'next/server'
import { fetchGitHubData, validateGitHubToken } from '@/lib/githubFetcher'

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username')

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 })
  }

  const token = process.env.GITHUB_TOKEN

  const data = await fetchGitHubData(username)
  const validToken = !!token && (await validateGitHubToken())

  return NextResponse.json({ data, hasToken: validToken })
}
