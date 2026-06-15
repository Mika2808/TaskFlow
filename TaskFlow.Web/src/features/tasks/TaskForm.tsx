import { Plus } from "lucide-react";
import { FormEvent, useState } from "react";
import { TaskGroup, TaskItem, createTask } from "../../api";
import { getErrorMessage } from "../../shared/errors";

type TaskFormProps = {
  token: string;
  groups: TaskGroup[];
  onCreated: (task: TaskItem) => void;
  setMessage: (message: string) => void;
};

export function TaskForm({ token, groups, onCreated, setMessage }: TaskFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [groupId, setGroupId] = useState("");
  const [deadline, setDeadline] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    try {
      const task = await createTask(token, { name, description, groupId, deadline });
      onCreated(task);
      setName("");
      setDescription("");
      setGroupId("");
      setDeadline("");
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  return (
    <form className="panel-section stack" onSubmit={handleSubmit}>
      <h2>New task</h2>
      <label>
        Name
        <input value={name} onChange={(event) => setName(event.target.value)} required />
      </label>
      <label>
        Description
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
        />
      </label>
      <label>
        Group
        <select value={groupId} onChange={(event) => setGroupId(event.target.value)}>
          <option value="">Without group</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </label>
      <label className="deadline-field">
        Deadline
        <input
          type="datetime-local"
          value={deadline}
          onChange={(event) => setDeadline(event.target.value)}
        />
      </label>
      <button className="primary-button">
        <Plus size={17} />
        Add task
      </button>
    </form>
  );
}
