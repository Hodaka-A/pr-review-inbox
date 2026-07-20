export const GET_PR_COMMENTS_QUERY = /* GraphQL */ `
  query GetPRComments {
    search(first: 20, query: "is:pr author:@me is:open", type: ISSUE) {
      issueCount
      edges {
        node {
          ... on PullRequest {
            title
            url
            number
            createdAt
            updatedAt
            state
            isDraft
            repository {
              nameWithOwner
              url
            }
            author {
              login
              avatarUrl
            }
            comments(first: 20) {
              totalCount
              nodes {
                author {
                  login
                  avatarUrl
                }
                createdAt
              }
            }
            additions
            deletions
            changedFiles
            labels(first: 20) {
              nodes {
                name
              }
            }
            reviews(first: 20) {
              nodes {
                author {
                  login
                  avatarUrl
                }
                state
                submittedAt
                body
              }
            }
            reviewThreads(first: 20) {
              nodes {
                isResolved
                path
                line
                comments(first: 20) {
                  nodes {
                    author {
                      login
                      avatarUrl
                    }
                    createdAt
                    body
                    url
                    diffHunk
                  }
                }
              }
            }
            reviewRequests(first: 20) {
              nodes {
                requestedReviewer {
                  ... on User {
                    login
                  }
                  ... on Team {
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;
