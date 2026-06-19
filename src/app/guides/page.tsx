import Link from "next/link";
import guides from "../../../data/guides.json";
import { AppShell, Badge, InfoCard, PageHeader } from "../_components/design-system";

export default function GuidesPage() {
  return (
    <AppShell>
      <PageHeader
        aside={
          <InfoCard description={`${guides.length}개 입문 가이드`} title="Guide MVP">
            <Badge tone="success">Phase N</Badge>
          </InfoCard>
        }
        description="Pokemon Champions 입문, 첫 랭크 준비, 상성 판단, 도구 사용법을 연결한 초보자용 공략 글입니다."
        eyebrow="Guides"
        title="가이드"
      />

      <section className="mx-auto grid max-w-7xl gap-4 px-6 py-6 lg:grid-cols-2 lg:px-10">
        {guides.map((guide) => (
          <Link
            className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 hover:bg-[var(--chip)]"
            href={`/guides/${guide.id}`}
            key={guide.id}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--muted)]">{guide.categoryKo}</p>
                <h2 className="mt-2 text-xl font-bold text-[var(--foreground)]">
                  {guide.titleKo}
                </h2>
              </div>
              <Badge tone="support">{guide.readingMinutes}분</Badge>
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{guide.summaryKo}</p>
          </Link>
        ))}
      </section>
    </AppShell>
  );
}
