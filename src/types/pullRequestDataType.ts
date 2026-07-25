// 基本的な型定義
export type Author = {
  login: string;
  avatarUrl: string;
} | null;

export type ReviewThreadCommentNode = {
  author?: Author;
  body: string;
  createdAt: string;
  url: string;
  diffHunk: string;
};

export type ReviewThreadNode = {
  isResolved: boolean;
  path: string;
  line: number;
  /** 複数行コメントの開始行。単一行コメントでは null */
  startLine: number | null;
  comments: {
    nodes: ReviewThreadCommentNode[];
  };
};

export type ReviewNode = {
  author?: Author;
  state: string;
  submittedAt: string;
  body: string;
  createdAt: string;
};

export type PullRequestNode = {
  title: string;
  url: string;
  number: number;
  createdAt: string;
  updatedAt: string;
  state: string;
  isDraft: boolean;
  repository: {
    nameWithOwner: string;
    url: string;
  };
  author?: Author;
  comments: {
    totalCount: number;
    nodes: {
      author?: Author;
      body: string;
      createdAt: string;
    }[];
  };
  additions: number;
  deletions: number;
  changedFiles: number;
  labels: {
    nodes: {
      name: string;
    }[];
  };
  reviews: {
    nodes: ReviewNode[];
  };
  reviewThreads: {
    nodes: ReviewThreadNode[];
  };
};

export type fetchResponsePullRequestDataType = {
  search: {
    issueCount: number;
    edges: {
      node: PullRequestNode;
    }[];
  };
};

export type ThreadComment = {
  commentType: "threadComment";
  threadId: string;
  threadIndex: number;
  threadCreatedAt: string;
  author?: string;
  avatarUrl?: string;
  isResolved?: boolean;
  body?: string;
  createdAt?: string;
  diffHunk?: string;
  url?: string;
  line?: number;
  /** 複数行コメントの開始行。単一行コメントでは line と同値 */
  startLine?: number;
  path?: string;
};

export type ReviewComment = {
  commentType: "reviewerComment";
  author?: string;
  avatarUrl?: string;
  state?: string;
  submittedAt?: string;
  body?: string;
  createdAt?: string;
};

export type MergedComment = ThreadComment | ReviewComment;

// コメント付きPR型
export type PullRequestWithCommentsType = {
  title: string;
  url: string;
  number: number;
  createdAt?: string;
  updatedAt?: string;
  state?: string;
  isDraft: boolean;
  repository?: {
    nameWithOwner: string;
    url: string;
  };
  comments?: MergedComment[];
  authorName?: string;
  authorAvatarUrl?: string;
};
