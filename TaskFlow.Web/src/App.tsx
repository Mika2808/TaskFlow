import {
  CheckCircle2,
  Circle,
  Clock3,
  Folder,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  API_BASE_URL,
  ApiError,
  CurrentUser,
  TaskGroup,
  TaskItem,
  TaskStatus,
  createTask,
  createTaskGroup,
  deleteTask,
  deleteTaskGroup,
  getMe,
  getTaskGroups,
  getTasks,
  login,
  register,
  updateTask,
} from "./api";

const TOKEN_KEY = "taskflow.token";

const statuses = [
  { value: TaskStatus.ToDo, label: "To do", icon: Circle },
  { value: TaskStatus.InProgress, label: "In progress", icon: Clock3 },
  { value: TaskStatus.Done, label: "Done", icon: CheckCircle2 },
  { value: TaskStatus.Cancelled, label: "Cancelled", icon: Trash2 },
];

function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [groups, setGroups] = useState<TaskGroup[]>([]);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [sortBy, setSortBy] = useState("deadline");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      return;
    }

    getMe(token)
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      });
  }, [token]);

  useEffect(() => {
    if (token && user) {
      void loadWorkspace();
    }
  }, [token, user, statusFilter, groupFilter, sortBy]);

  async function loadWorkspace() {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const [nextTasks, nextGroups] = await Promise.all([
        getTasks(token, {
          status: statusFilter,
          groupId: groupFilter,
          sortBy,
        }),
        getTaskGroups(token),
      ]);
      setTasks(nextTasks);
      setGroups(nextGroups);
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  function handleAuthenticated(nextToken: string) {
    localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setTasks([]);
    setGroups([]);
  }

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return tasks;
    }

    return tasks.filter((task) =>
      [task.name, task.description, getGroupName(groups, task.groupId)]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
    );
  }, [groups, search, tasks]);

  const counts = useMemo(() => {
    return statuses.map((status) => ({
      ...status,
      total: tasks.filter((task) => task.status === status.value).length,
    }));
  }, [tasks]);

  if (!token || !user) {
    return (
      <AuthView
        onAuthenticated={handleAuthenticated}
        message={message}
        setMessage={setMessage}
      />
    );
  }

  const activeToken = token;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">TaskFlow</p>
          <h1>Today&apos;s work</h1>
        </div>
        <div className="topbar-actions">
          <span>{user.email}</span>
          <button className="icon-button" onClick={() => void loadWorkspace()} title="Refresh">
            <RefreshCw size={18} />
          </button>
          <button className="icon-button" onClick={handleLogout} title="Log out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <section className="summary-strip">
        {counts.map((status) => {
          const Icon = status.icon;
          return (
            <button
              className={`summary-pill ${
                statusFilter === status.value ? "is-active" : ""
              }`}
              key={status.value}
              onClick={() => setStatusFilter(status.value)}
            >
              <Icon size={18} />
              <span>{status.label}</span>
              <strong>{status.total}</strong>
            </button>
          );
        })}
      </section>

      <section className="workspace">
        <aside className="side-panel">
            <TaskForm
            token={activeToken}
            groups={groups}
            onCreated={(task) => setTasks((current) => [task, ...current])}
            setMessage={setMessage}
          />
          <GroupPanel
            token={activeToken}
            groups={groups}
            onCreated={(group) => setGroups((current) => [...current, group])}
            onDeleted={(id) => {
              setGroups((current) => current.filter((group) => group.id !== id));
              setTasks((current) =>
                current.map((task) =>
                  task.groupId === id ? { ...task, groupId: null } : task,
                ),
              );
            }}
            setMessage={setMessage}
          />
        </aside>

        <section className="task-board">
          <div className="toolbar">
            <label className="search-field">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tasks"
              />
            </label>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value === "all"
                    ? "all"
                    : Number(event.target.value),
                )
              }
            >
              <option value="all">All statuses</option>
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            <select
              value={groupFilter}
              onChange={(event) => setGroupFilter(event.target.value)}
            >
              <option value="all">All groups</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="deadline">Deadline first</option>
              <option value="createdAt">Newest first</option>
            </select>
          </div>

          {message && <p className="notice">{message}</p>}

          <div className="task-list" aria-busy={isLoading}>
            {visibleTasks.length === 0 ? (
              <div className="empty-state">
                <h2>No tasks here</h2>
                <p>Create a task or adjust the filters to bring work into view.</p>
              </div>
            ) : (
              visibleTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  token={activeToken}
                  groups={groups}
                  onUpdated={(updated) =>
                    setTasks((current) =>
                      current.map((taskItem) =>
                        taskItem.id === updated.id ? updated : taskItem,
                      ),
                    )
                  }
                  onDeleted={(id) =>
                    setTasks((current) => current.filter((taskItem) => taskItem.id !== id))
                  }
                  setMessage={setMessage}
                />
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function AuthView({
  onAuthenticated,
  message,
  setMessage,
}: {
  onAuthenticated: (token: string) => void;
  message: string;
  setMessage: (message: string) => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginName, setLoginName] = useState("");
  const [email, setEmail] = useState("");
  const [nick, setNick] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      if (mode === "register") {
        await register(email, nick, password);
        const result = await login(email, password);
        onAuthenticated(result.token);
      } else {
        const result = await login(loginName, password);
        onAuthenticated(result.token);
      }
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="brand-mark">TF</div>
        <h1>TaskFlow</h1>
        <p>Plan tasks, group related work, and keep momentum visible.</p>

        <div className="segmented">
          <button
            className={mode === "login" ? "is-active" : ""}
            onClick={() => setMode("login")}
            type="button"
          >
            Sign in
          </button>
          <button
            className={mode === "register" ? "is-active" : ""}
            onClick={() => setMode("register")}
            type="button"
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="stack">
          {mode === "register" ? (
            <>
              <label>
                Email
                <input
                  autoComplete="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              <label>
                Nick
                <input
                  autoComplete="username"
                  value={nick}
                  onChange={(event) => setNick(event.target.value)}
                  required
                />
              </label>
            </>
          ) : (
            <label>
              Email or nick
              <input
                autoComplete="username"
                value={loginName}
                onChange={(event) => setLoginName(event.target.value)}
                required
              />
            </label>
          )}
          <label>
            Password
            <input
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              type="password"
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {message && <p className="notice">{message}</p>}
          <button className="primary-button" disabled={isSubmitting}>
            {isSubmitting
              ? "Working..."
              : mode === "register"
                ? "Create account"
                : "Sign in"}
          </button>
        </form>
        <p className="api-hint">API: {API_BASE_URL}</p>
      </section>
    </main>
  );
}

function TaskForm({
  token,
  groups,
  onCreated,
  setMessage,
}: {
  token: string;
  groups: TaskGroup[];
  onCreated: (task: TaskItem) => void;
  setMessage: (message: string) => void;
}) {
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
          <option value="">No group</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </label>
      <label>
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

function GroupPanel({
  token,
  groups,
  onCreated,
  onDeleted,
  setMessage,
}: {
  token: string;
  groups: TaskGroup[];
  onCreated: (group: TaskGroup) => void;
  onDeleted: (id: string) => void;
  setMessage: (message: string) => void;
}) {
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
          <div className="group-row" key={group.id}>
            <Folder size={16} />
            <span>{group.name}</span>
            <button
              className="icon-button"
              onClick={() => void handleDelete(group.id)}
              title="Delete group"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function TaskCard({
  task,
  token,
  groups,
  onUpdated,
  onDeleted,
  setMessage,
}: {
  task: TaskItem;
  token: string;
  groups: TaskGroup[];
  onUpdated: (task: TaskItem) => void;
  onDeleted: (id: string) => void;
  setMessage: (message: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(task.name);
  const [description, setDescription] = useState(task.description ?? "");
  const [deadline, setDeadline] = useState(toDateTimeLocal(task.deadline));

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
    await patchTask({ name, description, deadline });
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

  const currentStatus = statuses.find((status) => status.value === task.status) ?? statuses[0];
  const StatusIcon = currentStatus.icon;

  return (
    <article className={`task-card status-${task.status}`}>
      <div className="task-card-header">
        <span className="status-badge">
          <StatusIcon size={16} />
          {currentStatus.label}
        </span>
        <button className="icon-button" onClick={() => void handleDelete()} title="Delete task">
          <Trash2 size={16} />
        </button>
      </div>

      {isEditing ? (
        <form className="stack" onSubmit={handleSave}>
          <input value={name} onChange={(event) => setName(event.target.value)} required />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
          />
          <input
            type="datetime-local"
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
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
          <button className="task-title" onClick={() => setIsEditing(true)}>
            {task.name}
          </button>
          {task.description && <p>{task.description}</p>}
          <div className="task-meta">
            <span>{getGroupName(groups, task.groupId) ?? "No group"}</span>
            <span>{formatDeadline(task.deadline)}</span>
          </div>
        </>
      )}

      <div className="task-actions">
        <select
          value={task.status}
          onChange={(event) =>
            void patchTask({ status: Number(event.target.value) as TaskStatus })
          }
        >
          {statuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        <select
          value={task.groupId ?? ""}
          onChange={(event) => {
            if (event.target.value) {
              void patchTask({ groupId: event.target.value });
            }
          }}
        >
          <option value="">No group</option>
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

function getGroupName(groups: TaskGroup[], groupId: string | null) {
  return groups.find((group) => group.id === groupId)?.name;
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function formatDeadline(value: string | null) {
  if (!value) {
    return "No deadline";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function toDateTimeLocal(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export default App;
