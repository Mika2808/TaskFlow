export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ??
  "https://localhost:7230/api";

export enum TaskStatus {
  ToDo = 0,
  InProgress = 1,
  Done = 2,
  Cancelled = 3,
}

export type TaskItem = {
  id: string;
  name: string;
  description: string | null;
  status: TaskStatus;
  groupId: string | null;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskGroup = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
};

export type CurrentUser = {
  userId: string;
  email: string;
  role: string;
};

type RequestOptions = {
  token?: string | null;
  query?: Record<string, string | number | undefined | null>;
  body?: unknown;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  method = "GET",
  options: RequestOptions = {},
): Promise<T> {
  const url = new URL(`${API_BASE_URL}${path}`);

  Object.entries(options.query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new ApiError(getProblemMessage(data), response.status);
  }

  return data as T;
}

function getProblemMessage(data: unknown) {
  if (typeof data === "string" && data.length > 0) {
    return data;
  }

  if (data && typeof data === "object") {
    const problem = data as {
      title?: string;
      detail?: string;
      errors?: Record<string, string[]>;
    };
    const validation = problem.errors
      ? Object.values(problem.errors).flat().join(" ")
      : "";

    return [problem.title, problem.detail, validation].filter(Boolean).join(" ");
  }

  return "Something went wrong. Please try again.";
}

export function login(loginName: string, password: string) {
  return request<{ token: string }>("/Auth/login", "POST", {
    body: { login: loginName, password },
  });
}

export function register(email: string, nick: string, password: string) {
  return request<string>("/Auth/register", "POST", {
    body: { email, nick, password },
  });
}

export function getMe(token: string) {
  return request<CurrentUser>("/Auth/me", "GET", { token });
}

export function getTasks(
  token: string,
  query: { status?: TaskStatus | "all"; groupId?: string; sortBy?: string },
) {
  return request<TaskItem[]>("/tasks", "GET", {
    token,
    query: {
      status: query.status === "all" ? undefined : query.status,
      groupId: query.groupId === "all" ? undefined : query.groupId,
      sortBy: query.sortBy,
    },
  });
}

export function createTask(
  token: string,
  task: {
    name: string;
    description?: string;
    groupId?: string;
    deadline?: string;
  },
) {
  return request<TaskItem>("/tasks", "POST", {
    token,
    body: {
      name: task.name,
      description: task.description || null,
      groupId: task.groupId || null,
      deadline: task.deadline ? new Date(task.deadline).toISOString() : null,
    },
  });
}

export function updateTask(
  token: string,
  id: string,
  task: Partial<{
    name: string;
    description: string | null;
    status: TaskStatus;
    groupId: string | null;
    deadline: string | null;
    clearGroup: boolean;
    clearDeadline: boolean;
  }>,
) {
  return request<TaskItem>(`/tasks/${id}`, "PATCH", {
    token,
    body: {
      ...task,
      deadline: task.deadline ? new Date(task.deadline).toISOString() : task.deadline,
    },
  });
}

export function deleteTask(token: string, id: string) {
  return request<void>(`/tasks/${id}`, "DELETE", { token });
}

export function getTaskGroups(token: string) {
  return request<TaskGroup[]>("/task-groups", "GET", { token });
}

export function createTaskGroup(
  token: string,
  group: { name: string; description: string },
) {
  return request<TaskGroup>("/task-groups", "POST", { token, body: group });
}

export function updateTaskGroup(
  token: string,
  id: string,
  group: Partial<{ name: string; description: string }>,
) {
  return request<TaskGroup>(`/task-groups/${id}`, "PATCH", {
    token,
    body: group,
  });
}

export function deleteTaskGroup(token: string, id: string) {
  return request<void>(`/task-groups/${id}`, "DELETE", { token });
}
