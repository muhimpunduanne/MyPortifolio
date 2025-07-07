"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { formatDistanceToNow, format, parseISO } from "date-fns"
import { Github, GitCommit, GitBranch, Star, GitFork, Calendar, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GitHubData } from "@/types/github"

interface GitHubActivityProps {
  data: GitHubData | null
  hasToken?: boolean // Flag to indicate if GitHub token is available
}

export default function GitHubActivity({ data, hasToken = false }: GitHubActivityProps) {
  const [activeTab, setActiveTab] = useState("repositories")

  if (!data) {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
        <CardContent className="p-6">
          <div className="text-center text-cream py-8">
            Loading GitHub data for muhimpunduanne...
          </div>
        </CardContent>
      </Card>
    )
  }

  // Check if contribution data is available
  const hasContributions = data.contributions && data.contributions.length > 0

  // Function to determine contribution level color
  const getContributionColor = (count: number) => {
    if (count === 0) return "bg-white/10"
    if (count < 4) return "bg-green-900"
    if (count < 8) return "bg-green-700"
    if (count < 12) return "bg-green-500"
    return "bg-green-300"
  }

  return (
    <div className="space-y-6">
      {/* Token Missing Notice */}
      {!hasToken && (
        <Alert className="bg-blue-500/10 border-blue-500/20">
          <Info className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-200">
            <strong>Limited Data:</strong> Contribution graph data requires a GitHub token. 
            Repository and commit data is available through the public API.
          </AlertDescription>
        </Alert>
      )}

      {/* Contributions Missing Notice */}
      {!hasContributions && hasToken && (
        <Alert className="bg-orange-500/10 border-orange-500/20">
          <Info className="h-4 w-4 text-orange-400" />
          <AlertDescription className="text-orange-200">
            <strong>Contribution Data Unavailable:</strong> GitHub's contribution graph data 
            requires GraphQL API access with proper authentication.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="repositories" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10">
          <TabsTrigger
            value="repositories"
            className="data-[state=active]:bg-white/10 text-cream data-[state=active]:text-cream"
          >
            Repositories
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="data-[state=active]:bg-white/10 text-cream data-[state=active]:text-cream"
          >
            Recent Activity
          </TabsTrigger>
          <TabsTrigger
            value="contributions"
            className="data-[state=active]:bg-white/10 text-cream data-[state=active]:text-cream"
            disabled={!hasContributions}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Contributions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="repositories" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.repositories.slice(0, 4).map((repo, index) => (
              <motion.div
                key={repo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Github className="mr-2 h-5 w-5" />
                      <a href={repo.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {repo.name}
                      </a>
                    </CardTitle>
                    <CardDescription className="text-white/70">
                      {repo.description || "No description provided"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {repo.topics.slice(0, 5).map((topic) => (
                        <Badge key={topic} variant="outline" className="text-white border-white/30 bg-white/5">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center text-white/70 text-sm space-x-4">
                      <div className="flex items-center">
                        <Star className="mr-1 h-4 w-4" />
                        {repo.stars}
                      </div>
                      <div className="flex items-center">
                        <GitFork className="mr-1 h-4 w-4" />
                        {repo.forks}
                      </div>
                      <div className="flex items-center">
                        <GitBranch className="mr-1 h-4 w-4" />
                        {repo.defaultBranch}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className="text-white/70 text-sm">
                      Updated {formatDistanceToNow(new Date(repo.updatedAt))} ago
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
            <CardContent className="p-6">
              {data.commits.length > 0 ? (
                <ul className="space-y-4">
                  {data.commits.slice(0, 6).map((commit, index) => (
                    <motion.li
                      key={commit.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-start gap-4 pb-4 border-b border-white/10 last:border-0"
                    >
                      <div className="bg-white/10 rounded-full p-2 mt-1">
                        <GitCommit className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <a
                          href={commit.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white font-medium hover:underline"
                        >
                          {commit.message.length > 80 ? commit.message.substring(0, 80) + "..." : commit.message}
                        </a>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-white/70">
                          <span>{commit.repository}</span>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(commit.date))} ago</span>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <div className="text-center text-white/70 py-8">
                  No recent commits available. This may be due to API limitations or private repository activity.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contributions" className="mt-6">
          {hasContributions ? (
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white">
                    {data.contributions.reduce((sum, day) => sum + day.count, 0)} contributions in the last year
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded" 
                      size="sm"
                    >
                      2025
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-white/50 mt-1">GitHub Activity for muhimpunduanne</div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto pb-4">
                  <div className="min-w-[800px]">
                    {/* Month headers */}
                    <div className="flex mb-2">
                      <div className="w-10"></div>
                      <div className="flex flex-1 justify-between text-xs text-white/50">
                        <div>Jan</div>
                        <div>Feb</div>
                        <div>Mar</div>
                        <div>Apr</div>
                        <div>May</div>
                        <div>Jun</div>
                        <div>Jul</div>
                        <div>Aug</div>
                        <div>Sep</div>
                        <div>Oct</div>
                        <div>Nov</div>
                        <div>Dec</div>
                      </div>
                    </div>
                    
                    <div className="flex">
                      {/* Day labels */}
                      <div className="w-10 flex flex-col text-xs text-white/50 pr-2 py-1">
                        <div>Mon</div>
                        <div className="my-2"></div>
                        <div>Wed</div>
                        <div className="my-2"></div>
                        <div>Fri</div>
                      </div>
                      
                      {/* Contribution cells */}
                      <div className="flex-1">
                        <div className="grid grid-flow-col auto-cols-fr gap-[3px]">
                          {Array.from({ length: 53 }).map((_, weekIndex) => (
                            <div key={weekIndex} className="flex flex-col gap-[3px]">
                              {Array.from({ length: 7 }).map((_, dayIndex) => {
                                const contributionIndex = weekIndex * 7 + dayIndex;
                                if (contributionIndex >= data.contributions.length) {
                                  return <div key={dayIndex} className="w-3 h-3"></div>;
                                }
                                
                                const contribution = data.contributions[contributionIndex];
                                return (
                                  <div
                                    key={dayIndex}
                                    className={`w-3 h-3 rounded-sm ${getContributionColor(contribution.count)}`}
                                    title={`${contribution.count} contributions on ${format(parseISO(contribution.date), "MMM d, yyyy")}`}
                                  />
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end mt-4 text-xs text-white/50">
                      <span className="mr-2">Less</span>
                      <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-sm bg-white/10"></div>
                        <div className="w-3 h-3 rounded-sm bg-green-900"></div>
                        <div className="w-3 h-3 rounded-sm bg-green-700"></div>
                        <div className="w-3 h-3 rounded-sm bg-green-500"></div>
                        <div className="w-3 h-3 rounded-sm bg-green-300"></div>
                      </div>
                      <span className="ml-2">More</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
                  <h4 className="text-white font-medium mb-2">Contribution Stats</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {data.contributions.reduce((sum, day) => sum + day.count, 0)}
                      </div>
                      <div className="text-sm text-white/70">Total Contributions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {data.contributions.filter((day) => day.count > 0).length}
                      </div>
                      <div className="text-sm text-white/70">Days Active</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {Math.max(...data.contributions.map((day) => day.count))}
                      </div>
                      <div className="text-sm text-white/70">Max in a Day</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {(() => {
                          let currentStreak = 0
                          for (let i = data.contributions.length - 1; i >= 0; i--) {
                            if (data.contributions[i].count > 0) {
                              currentStreak++
                            } else {
                              break
                            }
                          }
                          return currentStreak
                        })()}
                      </div>
                      <div className="text-sm text-white/70">Current Streak</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
              <CardContent className="p-6">
                <div className="text-center text-white/70 py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-white/30" />
                  <h3 className="text-lg font-medium text-white mb-2">Contribution Data Unavailable</h3>
                  <p className="text-sm">
                    GitHub's contribution graph requires GraphQL API access with authentication.
                    Repository and commit data is available through the public API.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}