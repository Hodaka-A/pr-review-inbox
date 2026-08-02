export const GET_PR_COMMENTS_QUERY = /* GraphQL */ `
  query GetPRComments {
    search(first: 100, query: "is:pr author:@me is:open comments:>0", type: ISSUE) {
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
            reviews(first: 30) {
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
            reviewThreads(first: 30) {
              nodes {
                isResolved
                path
                line
                startLine
                comments(first: 30) {
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
          }
        }
      }
    }
  }
`;
