import { CalendarCheck, Pencil, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { TaskGroup, TaskItem, TaskStatus, deleteTask, updateTask } from "../../api";
import { getErrorMessage } from "../../shared/errors";
import { formatDeadline, getGroupName, toDateTimeLocal } from "../../shared/formatters";
import { taskStatuses } from "./taskStatuses";

type TaskCardProps = {
  task: TaskItem;
  token: string;
  groups: TaskGroup[];
  onUpdated: (task: TaskItem) => void;
  onDeleted: (id: string) => void;
  setMessage: (message: string) => void;
};

export function TaskCard({
  task,
  token,
  groups,
  onUpdated,
  onDeleted,
  setMessage,
}: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(task.name);
  const [description, setDescription] = useState(task.description ?? "");
  const [deadline, setDeadline] = useState(toDateTimeLocal(task.deadline));

  useEffect(() => {
    setName(task.name);
    setDescription(task.description ?? "");
    setDeadline(toDateTimeLocal(task.deadline));
  }, [task]);

  async function patchTask(update: Parameters<typeof updateTask>[2]) {
    setMessage("");

    try {
      const updated = await updateTask(token, task.id, update);
      onUpdated(updated);
      setIsEditing(false);
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    await patchTask({ name, description });
  }

  async function handleDeadlineSubmit(event: FormEvent) {
    event.preventDefault();
    await patchTask(deadline ? { deadline } : { clearDeadline: true });
  }

  async function handleDelete() {
    setMessage("");

    try {
      await deleteTask(token, task.id);
      onDeleted(task.id);
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  const currentStatus =
    taskStatuses.find((status) => status.value === task.status) ?? taskStatuses[0];
  const StatusIcon = currentStatus.icon;
  const groupName = getGroupName(groups, task.groupId);
  const formattedDeadline = formatDeadline(task.deadline);

  return (
    <article className={`task-card status-${task.status}`}>
      <div className="task-card-header">
        <span className="status-badge">
          <StatusIcon size={16} />
          {currentStatus.label}
        </span>
        <div className="task-card-actions">
          <button
            className="icon-button"
            onClick={() => setIsEditing((current) => !current)}
            title="Edit task"
          >
            <Pencil size={16} />
          </button>
          <button className="icon-button" onClick={() => void handleDelete()} title="Delete task">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {isEditing ? (
        <form className="stack" onSubmit={handleSave}>
          <input value={name} onChange={(event) => setName(event.target.value)} required />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
          />
          <div className="button-row">
            <button className="primary-button">Save</button>
            <button type="button" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <h3 className="task-title">{task.name}</h3>
          {task.description && <p>{task.description}</p>}
          <div className="task-meta">
            {groupName && <span>{groupName}</span>}
            {formattedDeadline && <span>{formattedDeadline}</span>}
          </div>
        </>
      )}

      <form className="deadline-editor" onSubmit={handleDeadlineSubmit}>
        <CalendarCheck size={17} />
        <input
          type="datetime-local"
          value={deadline}
          onChange={(event) => setDeadline(event.target.value)}
        />
        <button>Set</button>
      </form>

      <div className="task-actions">
        <select
          value={task.status}
          onChange={(event) =>
            void patchTask({ status: Number(event.target.value) as TaskStatus })
          }
        >
          {taskStatuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        <select
          value={task.groupId ?? ""}
          onChange={(event) =>
            void patchTask(
              event.target.value ? { groupId: event.target.value } : { clearGroup: true },
            )
          }
        >
          <option value="">Without group</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>
    </article>
  );
}
