import { request } from "./client";
import type { TaskGroup } from "../models/index";

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
