import { CheckCircle2, Circle, Clock3, Trash2 } from "lucide-react";
import { TaskStatus } from "../../api";

export const taskStatuses = [
  { value: TaskStatus.ToDo, label: "To do", icon: Circle },
  { value: TaskStatus.InProgress, label: "In progress", icon: Clock3 },
  { value: TaskStatus.Done, label: "Done", icon: CheckCircle2 },
  { value: TaskStatus.Cancelled, label: "Cancelled", icon: Trash2 },
] as const;

export type TaskStatusFilter = TaskStatus | "all";
