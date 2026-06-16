import { request } from "./client";
import type { TaskItem, TaskStatus } from "../models/index";

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
