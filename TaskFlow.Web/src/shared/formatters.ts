import { TaskGroup } from "../api";

export function getGroupName(groups: TaskGroup[], groupId: string | null) {
  return groups.find((group) => group.id === groupId)?.name;
}

export function formatDeadline(value: string | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function toDateTimeLocal(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}
