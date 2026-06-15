import { Search } from "lucide-react";
import { TaskGroup } from "../../api";
import { taskStatuses, TaskStatusFilter } from "./taskStatuses";

type TaskToolbarProps = {
  search: string;
  setSearch: (search: string) => void;
  statusFilter: TaskStatusFilter;
  setStatusFilter: (status: TaskStatusFilter) => void;
  groupFilter: string;
  setGroupFilter: (groupId: string) => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  groups: TaskGroup[];
};

export function TaskToolbar({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  groupFilter,
  setGroupFilter,
  sortBy,
  setSortBy,
  groups,
}: TaskToolbarProps) {
  return (
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
            event.target.value === "all" ? "all" : Number(event.target.value),
          )
        }
      >
        <option value="all">All statuses</option>
        {taskStatuses.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>
      <select value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)}>
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
  );
}
