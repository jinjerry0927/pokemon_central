import Link from "next/link";
import type { ReactNode } from "react";

type NavigationItem = {
  href: string;
  label: string;
};

type BadgeTone = "neutral" | "accent" | "support" | "success" | "warning" | "type";

type CardAction = {
  href: string;
  label: string;
};

type TabItem = {
  label: string;
  active?: boolean;
};

type FilterOption = {
  label: string;
  active?: boolean;
};

export type DataTableColumn<Row> = {
  key: keyof Row;
  label: string;
  align?: "left" | "right";
  render?: (value: Row[keyof Row], row: Row) => ReactNode;
};

const navigationItems: NavigationItem[] = [
  { href: "/pokedex", label: "도감" },
  { href: "/builds", label: "빌드" },
  { href: "/teams", label: "팀빌더" },
  { href: "/speed-tiers", label: "스피드" },
  { href: "/type-chart", label: "상성표" },
  { href: "/calculator", label: "계산기" },
  { href: "/guides", label: "가이드" },
  { href: "/about", label: "About" }
];

const badgeToneClass: Record<BadgeTone, string> = {
  neutral: "border-[var(--panel-border)] bg-[var(--chip)] text-[var(--foreground)]",
  accent: "border-[var(--accent-soft)] bg-[var(--accent-soft)] text-[var(--accent-strong)]",
  support: "border-[var(--brand-soft)] bg-[var(--brand-soft)] text-[var(--brand-strong)]",
  success: "border-[var(--success-soft)] bg-[var(--success-soft)] text-[var(--success-strong)]",
  warning: "border-[var(--warning-soft)] bg-[var(--warning-soft)] text-[var(--warning-strong)]",
  type: "border-[var(--type-border)] bg-[var(--type-bg)] text-[var(--type-text)]"
};

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-[var(--panel-border)] bg-white/95 shadow-[0_1px_0_rgba(24,32,51,0.04)] backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <Link
            className="flex min-h-11 items-center gap-3 text-lg font-extrabold tracking-tight text-[var(--foreground)]"
            href="/"
          >
            <span className="grid size-8 place-items-center rounded-md bg-[var(--brand)] text-sm font-black text-white shadow-[var(--shadow-card)]">
              PC
            </span>
            <span>Pokemon Central</span>
          </Link>
          <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 text-sm font-semibold text-[var(--muted)] sm:mx-0 sm:flex-wrap sm:px-0">
            {navigationItems.map((item) => (
              <Link
                className="flex min-h-11 shrink-0 items-center rounded-md px-3 transition-colors hover:bg-[var(--brand-soft)] hover:text-[var(--brand-strong)]"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-t border-[var(--panel-border)] bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-5 text-sm leading-6 text-[var(--muted)] sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <p>
            Pokemon Central은 팬메이드 공략 사이트이며 Pokemon Champions 또는 Pokemon 공식
            서비스가 아닙니다.
          </p>
          <div className="flex flex-wrap gap-3 font-semibold">
            <Link className="text-[var(--foreground)] hover:text-[var(--accent)]" href="/about">
              팬메이드 고지
            </Link>
            <Link className="text-[var(--foreground)] hover:text-[var(--accent)]" href="/sources">
              데이터 출처
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  aside
}: {
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
}) {
  return (
    <section className="border-b border-[var(--panel-border)] bg-white">
      <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-7 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-10 lg:py-9">
        <div className="relative border-l-4 border-[var(--electric)] pl-4 sm:pl-5">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--brand)]">
            {eyebrow}
          </p>
          <h1 className="mt-3 max-w-4xl text-2xl font-extrabold leading-tight tracking-tight text-[var(--foreground)] sm:text-3xl lg:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted)]">
            {description}
          </p>
        </div>
        {aside ? <div className="self-end">{aside}</div> : null}
      </div>
    </section>
  );
}

export function ThreeColumnLayout({
  left,
  center,
  right
}: {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
}) {
  return (
    <section className="mx-auto grid max-w-[1440px] gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)_320px] lg:px-10 lg:py-6 xl:grid-cols-[260px_minmax(0,1fr)_340px]">
      <aside className="min-w-0">{left}</aside>
      <div className="min-w-0">{center}</div>
      <aside className="min-w-0">{right}</aside>
    </section>
  );
}

export function InfoCard({
  title,
  description,
  children,
  action
}: {
  title: string;
  description?: string;
  children?: ReactNode;
  action?: CardAction;
}) {
  return (
    <section className="rounded-md border border-[var(--panel-border)] bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold tracking-tight text-[var(--foreground)]">{title}</h2>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p>
          ) : null}
        </div>
        {action ? (
          <Link
            className="flex min-h-10 shrink-0 items-center rounded-md border border-[var(--brand-soft)] bg-[var(--brand-soft)] px-3 text-sm font-bold text-[var(--brand-strong)] transition-colors hover:border-[var(--brand)] hover:bg-white"
            href={action.href}
          >
            {action.label}
          </Link>
        ) : null}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}

export function Badge({
  children,
  tone = "neutral"
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-md border px-2 py-1 text-xs font-bold leading-none ${badgeToneClass[tone]}`}
    >
      {children}
    </span>
  );
}

export function SearchField({
  label,
  placeholder,
  value,
  onChange
}: {
  label: string;
  placeholder: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[var(--foreground)]">{label}</span>
      <input
        className="mt-2 h-11 w-full rounded-md border border-[var(--panel-border)] bg-white px-3 text-sm outline-none placeholder:text-[var(--muted-soft)] hover:border-[var(--panel-border-strong)] focus:border-[var(--support)] focus:ring-2 focus:ring-[var(--support-soft)]"
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={value}
      />
    </label>
  );
}

export function FilterBar({
  label,
  options,
  onSelect
}: {
  label: string;
  options: FilterOption[];
  onSelect?: (label: string) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-[var(--foreground)]">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            className={`min-h-10 rounded-md border px-3 text-sm font-bold transition-colors ${
              option.active
                ? "border-[var(--brand)] bg-[var(--brand)] text-white shadow-sm"
                : "border-[var(--panel-border)] bg-white text-[var(--muted)] hover:border-[var(--panel-border-strong)] hover:bg-[var(--chip)] hover:text-[var(--foreground)]"
            }`}
            key={option.label}
            onClick={() => onSelect?.(option.label)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Tabs({ items }: { items: TabItem[] }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-md border border-[var(--panel-border)] bg-[var(--chip)] p-1">
      {items.map((item) => (
        <button
          className={`min-h-10 min-w-max flex-1 rounded px-3 text-sm font-bold transition-colors ${
            item.active
              ? "bg-white text-[var(--brand-strong)] shadow-sm"
              : "text-[var(--muted)] hover:bg-white/60 hover:text-[var(--foreground)]"
          }`}
          key={item.label}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function DataTable<Row extends object>({
  columns,
  rows
}: {
  columns: DataTableColumn<Row>[];
  rows: Row[];
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-[var(--panel-border)] bg-white shadow-[var(--shadow-card)]">
      <table className="w-full min-w-[680px] border-collapse text-left text-sm">
        <thead className="bg-[var(--chip)] text-xs uppercase tracking-wide text-[var(--muted)]">
          <tr>
            {columns.map((column) => (
              <th
                className={`border-b border-[var(--panel-border)] px-4 py-3 font-bold ${
                  column.align === "right" ? "text-right" : "text-left"
                }`}
                key={String(column.key)}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              className="border-b border-[var(--panel-border)] last:border-0 hover:bg-[var(--chip)]/60"
              key={rowIndex}
            >
              {columns.map((column) => {
                const value = row[column.key];

                return (
                  <td
                    className={`px-4 py-4 align-top ${
                      column.align === "right" ? "text-right" : "text-left"
                    }`}
                    key={String(column.key)}
                  >
                    {column.render ? column.render(value, row) : String(value ?? "")}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
