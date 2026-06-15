import { Folder, Info, Plus, Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { TaskGroup, createTaskGroup, deleteTaskGroup } from "../../api";
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
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);

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
      setOpenGroupId((current) => (current === id ? null : current));
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  return (
    <section className="panel-section">
      <h2>Groups</h2>
      <form className="compact-form" onSubmit={handleCreate}>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Group name"
          required
        />
        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description"
          required
        />
        <button className="icon-button" title="Add group">
          <Plus size={17} />
        </button>
      </form>
      <div className="group-list">
        {groups.map((group) => (
          <article className="group-item" key={group.id}>
            <div className="group-row">
              <Folder size={16} />
              <span>{group.name}</span>
              <button
                className="icon-button"
                onClick={() =>
                  setOpenGroupId((current) => (current === group.id ? null : group.id))
                }
                title="Show group description"
              >
                <Info size={16} />
              </button>
              <button
                className="icon-button"
                onClick={() => void handleDelete(group.id)}
                title="Delete group"
              >
                <Trash2 size={16} />
              </button>
            </div>
            {openGroupId === group.id && (
              <p className="group-description">{group.description}</p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
