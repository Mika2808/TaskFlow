import type { TaskGroup, TaskItem } from "../../models";
import { TaskCard } from "./TaskCard";

type TaskDashboardProps = {
  tasks: TaskItem[];
  token: string;
  groups: TaskGroup[];
  isLoading: boolean;
  message: string;
  onUpdated: (task: TaskItem) => void;
  onDeleted: (id: string) => void;
  setMessage: (message: string) => void;
};

export function TaskDashboard({
  tasks,
  token,
  groups,
  isLoading,
  message,
  onUpdated,
  onDeleted,
  setMessage,
}: TaskDashboardProps) {
  return (
    <>
      {message && <p className="notice">{message}</p>}

      <div className="task-list" aria-busy={isLoading}>
        {tasks.length === 0 ? (
          <div className="empty-state">
            <h2>No tasks here</h2>
            <p>Create a task or adjust the filters to bring work into view.</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              token={token}
              groups={groups}
              onUpdated={onUpdated}
              onDeleted={onDeleted}
              setMessage={setMessage}
            />
          ))
        )}
      </div>
    </>
  );
}
