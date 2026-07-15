interface Props {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  rangeStart: number; // 1-based index of first row shown
  rangeEnd: number; // 1-based index of last row shown
  onPage: (p: number) => void;
  onPageSize: (n: number) => void;
}

const PAGE_SIZES = [10, 15, 20, 40, 60, 80, 100];

// Windowed page list with ellipses, e.g. 1 … 4 5 [6] 7 8 … 20
function pageItems(page: number, pageCount: number): (number | "…")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const items: (number | "…")[] = [1];
  const left = Math.max(2, page - 1);
  const right = Math.min(pageCount - 1, page + 1);
  if (left > 2) items.push("…");
  for (let p = left; p <= right; p++) items.push(p);
  if (right < pageCount - 1) items.push("…");
  items.push(pageCount);
  return items;
}

export function Pagination({
  page, pageCount, pageSize, total, rangeStart, rangeEnd, onPage, onPageSize,
}: Props) {
  return (
    <div className="pagination">
      <div className="pagination-info">
        <label className="rows-per-page">
          Rows
          <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))}>
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        <span className="muted">
          {total === 0 ? "0 of 0" : `${rangeStart}–${rangeEnd} of ${total}`}
        </span>
      </div>

      {pageCount > 1 && (
        <div className="pagination-nav">
          <button className="btn-ghost page-btn" disabled={page <= 1} onClick={() => onPage(page - 1)}>
            ‹ Prev
          </button>
          {pageItems(page, pageCount).map((it, i) =>
            it === "…" ? (
              <span key={`e${i}`} className="page-ellipsis">…</span>
            ) : (
              <button
                key={it}
                className={`page-btn${it === page ? " page-btn-active" : ""}`}
                onClick={() => onPage(it)}
              >
                {it}
              </button>
            ),
          )}
          <button className="btn-ghost page-btn" disabled={page >= pageCount} onClick={() => onPage(page + 1)}>
            Next ›
          </button>
        </div>
      )}
    </div>
  );
}
