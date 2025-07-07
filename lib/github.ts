// githubFetcher.ts
import { GitHubData, Repository, Commit, ContributionDay } from "@/types/github"

const GITHUB_GRAPHQL_API = 'https://api.github.com/graphql'

const CONTRIBUTIONS_QUERY = `
  query($userName: String!) {
    user(login: $userName) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
      repositories(first: 10, orderBy: {field: UPDATED_AT, direction: DESC}) {
        nodes {
          id
          name
          description
          url
          stargazerCount
          forkCount
          repositoryTopics(first: 10) {
            nodes {
              topic {
                name
              }
            }
          }
          defaultBranchRef {
            name
          }
          updatedAt
        }
      }
    }
  }
`

// ----------- Real GitHub Data Fetcher (GraphQL) -----------
export async function fetchRealGitHubData(username: string): Promise<GitHubData> {
  const token = process.env.GITHUB_TOKEN

  if (!token) {
    console.warn('❌ No GitHub token provided in environment, falling back to REST API')
    return await fetchGitHubDataREST(username)
  }

  try {
    const response = await fetch(GITHUB_GRAPHQL_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: CONTRIBUTIONS_QUERY,
        variables: { userName: username },
      }),
    })

    if (!response.ok) throw new Error(`GitHub GraphQL API error: ${response.status}`)

    const json = await response.json()

    if (json.errors) throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`)

    const user = json.data.user

    if (!user) throw new Error(`User ${username} not found`)

    const repositories: Repository[] = user.repositories.nodes.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      description: repo.description,
      url: repo.url,
      stars: repo.stargazerCount,
      forks: repo.forkCount,
      topics: repo.repositoryTopics.nodes.map((topic: any) => topic.topic.name),
      defaultBranch: repo.defaultBranchRef?.name || 'main',
      updatedAt: repo.updatedAt,
    }))

    const contributions: ContributionDay[] = []

    user.contributionsCollection.contributionCalendar.weeks.forEach((week: any) => {
      week.contributionDays.forEach((day: any) => {
        contributions.push({
          date: day.date,
          count: day.contributionCount,
        })
      })
    })

    const commits = await fetchRecentCommits(username)

    return {
      username,
      repositories,
      commits,
      contributions,
    }
  } catch (error) {
    console.error('❌ Error fetching GitHub data via GraphQL:', error)
    return await fetchGitHubDataREST(username)
  }
}

// ----------- REST API Fallback -----------
async function fetchGitHubDataREST(username: string): Promise<GitHubData> {
  try {
    const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`)
    if (!reposResponse.ok) throw new Error(`GitHub REST API error: ${reposResponse.status}`)

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

    const commits = await fetchRecentCommits(username)

    return {
      username,
      repositories,
      commits,
      contributions: [],
    }
  } catch (error) {
    console.error('❌ Error fetching GitHub data with REST API:', error)
    throw error
  }
}

// ----------- Recent Commits -----------
async function fetchRecentCommits(username: string): Promise<Commit[]> {
  try {
    const token = process.env.GITHUB_TOKEN
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
    }

    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`https://api.github.com/users/${username}/events?per_page=30`, {
      headers,
    })

    if (!res.ok) throw new Error(`GitHub commits fetch failed: ${res.status}`)

    const events = await res.json()

    const commits: Commit[] = []

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

    return commits.slice(0, 10)
  } catch (error) {
    console.error('❌ Error fetching recent commits:', error)
    return []
  }
}

// ----------- Caching Layer -----------
let dataCache: { [key: string]: { data: GitHubData; timestamp: number } } = {}
const CACHE_DURATION = 10 * 60 * 1000 // 10 min

export async function fetchGitHubData(username: string): Promise<GitHubData> {
  const cacheKey = username
  const now = Date.now()

  if (dataCache[cacheKey] && now - dataCache[cacheKey].timestamp < CACHE_DURATION) {
    return dataCache[cacheKey].data
  }

  const data = await fetchRealGitHubData(username)

  dataCache[cacheKey] = { data, timestamp: now }

  return data
}

export function clearGitHubCache(username?: string): void {
  if (username) {
    Object.keys(dataCache).forEach(key => {
      if (key.startsWith(username)) delete dataCache[key]
    })
  } else {
    dataCache = {}
  }
}
