import Link from "next/link";
import { AppShell, Badge, InfoCard, PageHeader } from "./_components/design-system";
import { createPageMetadata, siteDescription, siteName } from "./_lib/seo";

export const metadata = {
  ...createPageMetadata({
    title: siteName,
    description: siteDescription
  }),
  title: {
    absolute: siteName
  }
};

const featureCards = [
  {
    href: "/pokedex",
    title: "도감",
    description: "포켓몬별 타입, 역할, 주요 기술, 추천 빌드로 빠르게 이동합니다."
  },
  {
    href: "/builds",
    title: "빌드",
    description: "성격, 노력치, 기술, 아이템과 운영 포인트를 한 화면에서 확인합니다."
  },
  {
    href: "/teams",
    title: "팀빌더",
    description: "6마리 조합의 타입 약점과 역할 균형을 로컬 저장 기준으로 점검합니다."
  },
  {
    href: "/speed-tiers",
    title: "스피드 티어",
    description: "랭크전에서 자주 만나는 속도 기준을 검색하고 비교합니다."
  },
  {
    href: "/type-chart",
    title: "타입 상성표",
    description: "단일/복합 타입의 약점, 반감, 무효 상성을 빠르게 확인합니다."
  },
  {
    href: "/calculator",
    title: "데미지 계산기",
    description: "공격자, 방어자, 기술을 고르고 초보자가 읽기 쉬운 결과를 제공합니다."
  },
  {
    href: "/guides",
    title: "가이드",
    description: "Pokemon Champions 입문과 첫 랭크 준비에 필요한 글을 연결합니다."
  }
];

export default function Home() {
  return (
    <AppShell>
      <PageHeader
        aside={
          <InfoCard description="도감, 빌드, 팀빌더, 스피드, 계산기를 홈에서 바로 시작합니다." title="데스크탑 허브">
            <div className="flex flex-wrap gap-2">
              <Badge tone="accent">Phase R</Badge>
              <Badge tone="success">Static export</Badge>
              <Badge tone="support">TypeScript</Badge>
              <Badge>Local data</Badge>
            </div>
          </InfoCard>
        }
        description="도감, 추천 빌드, 팀빌더, 스피드 티어, 데미지 계산을 하나의 흐름으로 연결하는 데스크톱 우선 MVP입니다."
        eyebrow="Pokemon Champions Guide Web"
        title="한국어로 빠르게 찾는 포켓몬 공략 허브"
      />

      <section className="mx-auto max-w-[1440px] px-6 py-10 lg:px-10">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featureCards.map((feature) => (
            <Link
              className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 hover:border-[var(--support)]"
              href={feature.href}
              key={feature.title}
            >
              <h2 className="text-xl font-bold">{feature.title}</h2>
              <p className="mt-3 leading-7 text-[var(--muted)]">{feature.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
