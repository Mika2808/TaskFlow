import { LogOut, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getMe,
  getTaskGroups,
  getTasks,
} from "./api";
import { CurrentUser, TaskGroup, TaskItem, TaskStatus } from "./models/index";
import { AuthView } from "./features/auth";
import { GroupPanel } from "./features/groups";
import { TaskDashboard, TaskForm, TaskToolbar, taskStatuses } from "./features/tasks";
import { getErrorMessage } from "./shared/errors";
import { getGroupName } from "./shared/formatters";

const TOKEN_KEY = "taskflow.token";

function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [allTasks, setAllTasks] = useState<TaskItem[]>([]);
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
      const [nextTasks, nextAllTasks, nextGroups] = await Promise.all([
        getTasks(token, {
          status: statusFilter,
          groupId: groupFilter,
          sortBy,
        }),
        getTasks(token, { status: "all", groupId: "all", sortBy }),
        getTaskGroups(token),
      ]);
      setTasks(nextTasks);
      setAllTasks(nextAllTasks);
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
    setAllTasks([]);
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
          <span>Hello, {user.name}!</span>
          <button className="icon-button" onClick={() => void loadWorkspace()} title="Refresh">
            <RefreshCw size={18} />
          </button>
          <button className="icon-button" onClick={handleLogout} title="Log out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <section className="summary-strip">
        {taskStatuses.map((status) => {
          const Icon = status.icon;
          return (
            <button
              className={`summary-pill ${
                statusFilter === status.value ? "is-active" : ""
              }`}
              key={status.value}
              onClick={() => setStatusFilter(statusFilter === status.value ? "all" : status.value)}
            >
              <Icon size={18} />
              <span>{status.label}</span>
              <strong>{allTasks.filter((task) => task.status === status.value).length}</strong>
            </button>
          );
        })}
      </section>

      <section className="workspace">
        <aside className="side-panel">
          <TaskForm
            token={activeToken}
            groups={groups}
            onCreated={(task) => {
              setTasks((current) => [task, ...current]);
              setAllTasks((current) => [task, ...current]);
            }}
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
              setAllTasks((current) =>
                current.map((task) => (task.groupId === id ? { ...task, groupId: null } : task)),
              );
            }}
            setMessage={setMessage}
          />
        </aside>

        <section className="task-board">
          <TaskToolbar
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            groupFilter={groupFilter}
            setGroupFilter={setGroupFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            groups={groups}
          />
          <TaskDashboard
            tasks={visibleTasks}
            token={activeToken}
            groups={groups}
            isLoading={isLoading}
            message={message}
            onUpdated={(updated) =>
              {
                setTasks((current) =>
                  current.map((taskItem) => (taskItem.id === updated.id ? updated : taskItem)),
                );
                setAllTasks((current) =>
                  current.map((taskItem) => (taskItem.id === updated.id ? updated : taskItem)),
                );
                if (statusFilter !== "all" && updated.status !== statusFilter) {
                  setStatusFilter("all");
                }
              }
            }
            onDeleted={(id) => {
              setTasks((current) => current.filter((taskItem) => taskItem.id !== id));
              setAllTasks((current) => current.filter((taskItem) => taskItem.id !== id));
            }}
            setMessage={setMessage}
          />
        </section>
      </section>
    </main>
  );
}

export default App;
