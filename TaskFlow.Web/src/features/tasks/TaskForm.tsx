import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createTask } from "../../api";
import type { TaskGroup, TaskItem } from "../../models";
import { getErrorMessage } from "../../shared/errors";

type TaskFormProps = {
  token: string;
  groups: TaskGroup[];
  onCreated: (task: TaskItem) => void;
  setMessage: (message: string) => void;
};

type TailwindDatePickerProps = {
  value: Date | null;
  onChange: (value: Date | null) => void;
};

const pad = (value: number) => String(value).padStart(2, "0");

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const yearOptions = Array.from({ length: 41 }, (_, index) => new Date().getFullYear() - 20 + index);

const formatDateTime = (date: Date) =>
  date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const formatTimeValue = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

function TailwindDatePicker({ value, onChange }: TailwindDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftDate, setDraftDate] = useState<Date | null>(value);
  const [viewMonth, setViewMonth] = useState<Date>(value ?? new Date());
  const inputRef = useRef<HTMLInputElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDraftDate(value);
    if (value) {
      setViewMonth(value);
    }
  }, [value]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        inputRef.current &&
        !inputRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const calendarDays = useMemo(() => {
    const calendarStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const firstDay = calendarStart.getDay();
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), index - firstDay + 1);
      return day;
    });
  }, [viewMonth]);

  const selectedDate = draftDate;

  const selectDay = (day: Date) => {
    const next = new Date(day);
    if (draftDate) {
      next.setHours(draftDate.getHours(), draftDate.getMinutes(), 0, 0);
    } else {
      next.setHours(12, 0, 0, 0);
    }
    setDraftDate(next);
  };

  const timeValue = draftDate ? formatTimeValue(draftDate) : "12:00";

  const handleTimeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = event.target.value.split(":").map(Number);
    setDraftDate((current) => {
      const next = current ? new Date(current) : new Date();
      next.setHours(hours, minutes, 0, 0);
      return next;
    });
  };

  const handleOpen = () => {
    setDraftDate(value);
    setIsOpen(true);
  };

  return (
    <div className="deadline-field">
      <input
        ref={inputRef}
        type="text"
        readOnly
        className="datepicker-input"
        placeholder="Select date and time"
        value={value ? formatDateTime(value) : ""}
        onClick={handleOpen}
        onFocus={handleOpen}
      />
      {isOpen ? (
        <div ref={panelRef} className="datepicker-panel">
          <div className="datepicker-header">
            <select
              className="datepicker-select"
              value={viewMonth.getMonth()}
              onChange={(event) =>
                setViewMonth(
                  (current) =>
                    new Date(current.getFullYear(), Number(event.target.value), 1),
                )
              }
            >
              {monthNames.map((name, index) => (
                <option key={name} value={index}>
                  {name}
                </option>
              ))}
            </select>
            <select
              className="datepicker-select"
              value={viewMonth.getFullYear()}
              onChange={(event) =>
                setViewMonth(
                  (current) =>
                    new Date(Number(event.target.value), current.getMonth(), 1),
                )
              }
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="datepicker-weekdays">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((weekday) => (
              <div key={weekday} className="datepicker-weekday">
                {weekday}
              </div>
            ))}
          </div>
          <div className="datepicker-grid">
            {calendarDays.map((day) => {
              const isOtherMonth = day.getMonth() !== viewMonth.getMonth();
              const isSelected =
                selectedDate &&
                day.getFullYear() === selectedDate.getFullYear() &&
                day.getMonth() === selectedDate.getMonth() &&
                day.getDate() === selectedDate.getDate();
              const isToday = (() => {
                const today = new Date();
                return (
                  day.getFullYear() === today.getFullYear() &&
                  day.getMonth() === today.getMonth() &&
                  day.getDate() === today.getDate()
                );
              })();

              return (
                <button
                  type="button"
                  key={day.toISOString()}
                  className={`datepicker-day ${isOtherMonth ? 'datepicker-day-outside' : ''} ${isSelected ? 'datepicker-day-selected' : ''} ${isToday ? 'datepicker-day-today' : ''}`}
                  onClick={() => selectDay(day)}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
          <div className="datepicker-time-row">
            <label className="datepicker-time-label">
              Time
              <input
                type="time"
                value={timeValue}
                onChange={handleTimeChange}
                className="datepicker-time-input"
              />
            </label>
          </div>
          <div className="datepicker-footer">
            <button
              type="button"
              className="datepicker-action-button datepicker-cancel-button"
              onClick={() => {
                setDraftDate(value);
                setIsOpen(false);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="datepicker-action-button datepicker-ok-button"
              onClick={() => {
                onChange(draftDate);
                setIsOpen(false);
              }}
            >
              OK
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function TaskForm({ token, groups, onCreated, setMessage }: TaskFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [groupId, setGroupId] = useState("");
  const [deadline, setDeadline] = useState<string | null>(null);
  const [deadlineDate, setDeadlineDate] = useState<Date | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    try {
      const task = await createTask(token, { name, description, groupId, deadline: deadline ?? undefined });
      onCreated(task);
      setName("");
      setDescription("");
      setGroupId("");
      setDeadline(null);
      setDeadlineDate(null);
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  return (
    <form className="panel-section stack" onSubmit={handleSubmit}>
      <h2>Create New task</h2>
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
        <select value={groupId} data-empty={groupId === ""} onChange={(event) => setGroupId(event.target.value)}>
          <option value="">
            — No group —
          </option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </label>
      <label className="deadline-field">
        Deadline
        <TailwindDatePicker
          value={deadlineDate}
          onChange={(next) => {
            setDeadlineDate(next);
            setDeadline(next ? next.toISOString() : null);
          }}
        />
      </label>
      <button className="primary-button">
        <Plus size={17} />
        Add task
      </button>
    </form>
  );
}
