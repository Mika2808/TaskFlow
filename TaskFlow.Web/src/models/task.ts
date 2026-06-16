import { TaskStatus } from './taskStatus';
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