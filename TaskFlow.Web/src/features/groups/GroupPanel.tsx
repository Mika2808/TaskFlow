import { Folder, Plus, Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { createTaskGroup, deleteTaskGroup } from "../../api";
import type { TaskGroup } from "../../models";
import { getErrorMessage } from "../../shared/errors";

type GroupPanelProps = {
  token: string;
  groups: TaskGroup[];
  onCreated: (group: TaskGroup) => void;
  onDeleted: (id: string) => void;
  setMessage: (message: string) => void;
};

export function GroupPanel({
  token,
  groups,
  onCreated,
  onDeleted,
  setMessage,
}: GroupPanelProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    try {
      const group = await createTaskGroup(token, { name, description });
      onCreated(group);
      setName("");
      setDescription("");
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function handleDelete(id: string) {
    setMessage("");

    try {
      await deleteTaskGroup(token, id);
      onDeleted(id);
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  return (
    <section className="panel-section">
      <h2>Groups</h2>
      <form className="compact-form" onSubmit={handleCreate}>
        <label>
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>
        <label>
          Description
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={2}
            required
          />
        </label>
        <button className="primary-button" type="submit">
          <Plus size={17} />
          Add group
        </button>
      </form>
      <div className="group-list">
        {groups.map((group) => (
          <article className="group-item" key={group.id}>
            <div className="group-item-header">
              <div className="group-item-title">
                <Folder size={16} />
                <span>{group.name}</span>
              </div>
              <button
                className="icon-button"
                onClick={() => void handleDelete(group.id)}
                title="Delete group"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <p className="group-description">{group.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
