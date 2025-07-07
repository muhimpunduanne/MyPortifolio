const openSource = {
  githubConvertedToken: "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", // Replace with your actual token
  githubUserName: "Derrick-MUGISHA", // Corrected username, no trailing dot
};

const fetch = require("node-fetch");
const fs = require("fs");

const query_contributions = {
  query: `
    query {
      user(login: "${openSource.githubUserName}") {
        contributionsCollection {
          totalCommitContributions
          totalIssueContributions
          totalPullRequestContributions
          totalPullRequestReviewContributions
          totalRepositoriesWithContributedCommits

          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }

          commitContributionsByRepository(maxRepositories: 10) {
            repository {
              nameWithOwner
              url
            }
            contributions(first: 5) {
              nodes {
                occurredAt
                commitCount
                repository {
                  nameWithOwner
                }
              }
              totalCount
            }
          }

          issueContributions(first: 10) {
            nodes {
              occurredAt
              issue {
                title
                url
                state
                repository {
                  nameWithOwner
                }
              }
            }
          }

          pullRequestContributions(first: 10) {
            nodes {
              occurredAt
              pullRequest {
                title
                url
                state
                merged
                repository {
                  nameWithOwner
                }
              }
            }
          }

          pullRequestReviewContributions(first: 10) {
            nodes {
              occurredAt
              pullRequestReview {
                url
                state
                pullRequest {
                  title
                  url
                  repository {
                    nameWithOwner
                  }
                }
              }
            }
          }
        }
      }
    }
  `,
};

const baseUrl = "https://api.github.com/graphql";
const headers = {
  "Content-Type": "application/json",
  Authorization: "bearer " + openSource.githubConvertedToken,
};

fetch(baseUrl, {
  method: "POST",
  headers: headers,
  body: JSON.stringify(query_contributions),
})
  .then((response) => response.json())
  .then((data) => {
    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
      return;
    }

    const contributions = data.data.user.contributionsCollection;
    console.log("Fetching Contributions Data.\n");

    // Make sure directory exists before writing (optional)
    const dir = "./src/shared/opensource";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFile(
      dir + "/contributions.json",
      JSON.stringify(contributions, null, 2),
      (err) => {
        if (err) {
          console.error("Error writing contributions.json:", err);
        } else {
          console.log("Contributions data saved successfully.");
        }
      }
    );
  })
  .catch((error) => {
    console.error("Error fetching contributions:", error);
  });
