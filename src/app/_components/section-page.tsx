import Link from "next/link";
import { AppShell } from "./design-system";

type SectionPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  items?: string[];
};

export function SectionPage({
  eyebrow,
  title,
  description,
  items = []
}: SectionPageProps) {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-10 lg:px-10">
        <Link className="text-sm font-semibold text-[var(--accent)]" href="/">
          Pokemon Central
        </Link>
        <section className="mt-8 border-y border-[var(--panel-border)] py-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-[var(--foreground)] lg:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--muted)]">
            {description}
          </p>
        </section>
        {items.length > 0 ? (
          <section className="mt-8 grid gap-3 md:grid-cols-2">
            {items.map((item) => (
              <div
                className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4 text-sm font-semibold"
                key={item}
              >
                {item}
              </div>
            ))}
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
