// types/github.ts
export interface Repository {
  id: string
  name: string
  description: string
  url: string
  stars: number
  forks: number
  topics: string[]
  defaultBranch: string
  updatedAt: string
}

export interface Commit {
  id: string
  message: string
  repository: string
  url: string
  date: string
}

export interface ContributionDay {
  date: string
  count: number
}

export interface GitHubData {
  username: string
  repositories: Repository[]
  commits: Commit[]
  contributions: ContributionDay[]
}