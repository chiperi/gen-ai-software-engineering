import { CATEGORIES, PRIORITIES, STATUSES, type Filters } from "../types";

interface Props {
  value: Filters;
  onChange: (next: Filters) => void;
}

export function FilterBar({ value, onChange }: Props) {
  const set = (key: keyof Filters) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    onChange({ ...value, [key]: e.target.value });

  return (
    <div className="filters">
      <label>
        Category
        <select value={value.category ?? ""} onChange={set("category")}>
          <option value="">All</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
          ))}
        </select>
      </label>
      <label>
        Priority
        <select value={value.priority ?? ""} onChange={set("priority")}>
          <option value="">All</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </label>
      <label>
        Status
        <select value={value.status ?? ""} onChange={set("status")}>
          <option value="">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
      </label>
      <button className="btn-ghost" onClick={() => onChange({})}>Clear</button>
    </div>
  );
}
