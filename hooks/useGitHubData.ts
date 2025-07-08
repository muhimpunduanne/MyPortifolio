// hooks/useGitHubData.ts
import { useState, useEffect } from 'react'
import { GitHubData, Repository, Commit, ContributionDay } from "@/types/github"

const GITHUB_USERNAME = "Derrick-MUGISHA"

interface UseGitHubDataReturn {
  data: GitHubData | null
  loading: boolean
  error: string | null
  hasToken: boolean
  refetch: () => void
}

export function useGitHubData(): UseGitHubDataReturn {
  const [data, setData] = useState<GitHubData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasToken, setHasToken] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      // First, try to get repositories and commits from REST API
      const reposResponse = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=10`)
      if (!reposResponse.ok) throw new Error('Failed to fetch repositories')

      const reposData = await reposResponse.json()
      
      const repositories: Repository[] = reposData.map((repo: any) => ({
        id: repo.id.toString(),
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        topics: repo.topics || [],
        defaultBranch: repo.default_branch,
        updatedAt: repo.updated_at,
      }))

      // Get recent commits
      const commitsResponse = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/events?per_page=30`)
      let commits: Commit[] = []
      
      if (commitsResponse.ok) {
        const events = await commitsResponse.json()
        
        events.forEach((event: any) => {
          if (event.type === 'PushEvent') {
            event.payload.commits.forEach((commit: any) => {
              commits.push({
                id: commit.sha,
                message: commit.message,
                repository: event.repo.name.split('/')[1],
                url: `https://github.com/${event.repo.name}/commit/${commit.sha}`,
                date: event.created_at,
              })
            })
          }
        })
      }

      commits = commits.slice(0, 10)

      // Try to get contributions from your API route
      let contributions: ContributionDay[] = []
      let tokenAvailable = false

      try {
        const contributionsResponse = await fetch('/api/github')
        
        if (contributionsResponse.ok) {
          const contributionsData = await contributionsResponse.json()
          tokenAvailable = true
          
          // Transform the API response to match your ContributionDay format
          if (contributionsData.contributionCalendar?.weeks) {
            contributionsData.contributionCalendar.weeks.forEach((week: any) => {
              week.contributionDays.forEach((day: any) => {
                contributions.push({
                  date: day.date,
                  count: day.contributionCount,
                })
              })
            })
          }
        }
      } catch (contributionsError) {
        console.warn('Could not fetch contributions:', contributionsError)
      }

      setHasToken(tokenAvailable)
      setData({
        username: GITHUB_USERNAME,
        repositories,
        commits,
        contributions,
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return {
    data,
    loading,
    error,
    hasToken,
    refetch: fetchData,
  }
}