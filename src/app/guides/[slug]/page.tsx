import Link from "next/link";
import { notFound } from "next/navigation";
import guides from "../../../../data/guides.json";
import { AppShell, Badge, InfoCard, PageHeader } from "../../_components/design-system";

type GuideRoute = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return guides.map((guide) => ({
    slug: guide.id
  }));
}

export default async function GuideDetailPage({ params }: GuideRoute) {
  const { slug } = await params;
  const guide = guides.find((entry) => entry.id === slug);

  if (!guide) {
    notFound();
  }

  return (
    <AppShell>
      <PageHeader
        aside={
          <InfoCard description={`${guide.readingMinutes}분 읽기`} title="가이드 분류">
            <Badge tone="support">{guide.categoryKo}</Badge>
          </InfoCard>
        }
        description={guide.summaryKo}
        eyebrow="Guide Detail"
        title={guide.titleKo}
      />

      <section className="mx-auto grid max-w-7xl gap-4 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-10">
        <article className="grid gap-4">
          {guide.sections.map((section) => (
            <InfoCard description={section.bodyKo} key={section.headingKo} title={section.headingKo} />
          ))}
        </article>

        <aside className="self-start">
          <InfoCard title="관련 페이지">
            <div className="grid gap-2">
              {guide.relatedLinks.map((link) => (
                <Link
                  className="rounded-md border border-[var(--panel-border)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--chip)]"
                  href={link.href}
                  key={link.href}
                >
                  {link.labelKo}
                </Link>
              ))}
            </div>
          </InfoCard>
        </aside>
      </section>
    </AppShell>
  );
}
