import Link from "next/link";
import usageInsights from "../../data/generated/usage-insights-m-b.json";
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

const primaryActions = [
  {
    href: "/pokedex",
    label: "도감에서 포켓몬 찾기",
    description: "타입, 역할, 상세 링크"
  },
  {
    href: "/teams",
    label: "팀빌더 열기",
    description: "약점, 역할, 사용률 힌트"
  },
  {
    href: "/calculator",
    label: "계산기로 확인",
    description: "공격자, 방어자, 기술"
  }
];

const workflowSteps = [
  {
    href: "/pokedex",
    label: "도감",
    detail: "후보 포켓몬의 타입, 역할, 주요 기술을 먼저 좁힙니다."
  },
  {
    href: "/teams",
    label: "팀빌더",
    detail: "6마리 조합의 약점과 역할 균형을 로컬 저장 기준으로 점검합니다."
  },
  {
    href: "/calculator",
    label: "계산기",
    detail: "선택한 포켓몬과 기술의 데미지 범위를 확인합니다."
  },
  {
    href: "/speed-tiers",
    label: "스피드",
    detail: "자주 마주치는 스피드 기준과 추월 관계를 비교합니다."
  }
];

const supportLinks = [
  { href: "/builds", label: "빌드", value: "성격/노력치/운영 메모" },
  { href: "/type-chart", label: "상성표", value: "단일/복합 방어 상성" },
  { href: "/guides", label: "가이드", value: "입문과 랭크 준비 흐름" }
];

export default function Home() {
  return (
    <AppShell>
      <PageHeader
        aside={
          <InfoCard
            description="Doubles Current 스냅샷을 정답 빌드가 아닌 선택지 탐색 신호로 보여줍니다."
            title="사용률 인사이트"
          >
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="border-l-2 border-[var(--support)] pl-3">
                <p className="text-xs font-bold uppercase text-[var(--muted)]">Regulation</p>
                <p className="mt-1 font-extrabold text-[var(--foreground)]">
                  {usageInsights.regulationId}
                </p>
              </div>
              <div className="border-l-2 border-[var(--accent)] pl-3">
                <p className="text-xs font-bold uppercase text-[var(--muted)]">Coverage</p>
                <p className="mt-1 font-extrabold text-[var(--foreground)]">
                  {usageInsights.entries.length}마리
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
              확인일 {usageInsights.checkedAt}. 높은 사용률은 추천 확정이 아니라 검토 우선순위입니다.
            </p>
          </InfoCard>
        }
        description="도감, 팀빌더, 계산기, 사용률 인사이트를 한 흐름으로 연결한 한국어 랭크 준비용 데이터 워크벤치입니다."
        eyebrow="Korean Battle Desk"
        title="포켓몬 선택부터 계산까지 빠르게 이어지는 준비 허브"
      />

      <section className="mx-auto grid max-w-[1440px] gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-10 lg:py-8">
        <div className="grid gap-5">
          <div className="rounded-md border border-[var(--panel-border)] bg-white p-4 shadow-[0_1px_2px_rgba(24,32,51,0.04)] sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-[var(--foreground)]">
                  빠른 시작
                </h2>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  처음 진입한 사용자가 바로 탐색, 조합, 검증 중 하나를 고를 수 있게 정리했습니다.
                </p>
              </div>
              <Badge tone="support">Static data</Badge>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {primaryActions.map((action) => (
                <Link
                  className="group rounded-md border border-[var(--panel-border)] bg-[var(--chip)] p-4 hover:border-[var(--support)] hover:bg-white"
                  href={action.href}
                  key={action.href}
                >
                  <p className="text-sm font-extrabold text-[var(--foreground)] group-hover:text-[var(--support-strong)]">
                    {action.label}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{action.description}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            {workflowSteps.map((step, index) => (
              <Link
                className="grid gap-3 rounded-md border border-[var(--panel-border)] bg-white p-4 hover:border-[var(--panel-border-strong)] hover:bg-[var(--chip)] sm:grid-cols-[64px_120px_minmax(0,1fr)] sm:items-center"
                href={step.href}
                key={step.href}
              >
                <span className="text-xs font-bold uppercase text-[var(--muted)]">
                  Step {index + 1}
                </span>
                <span className="text-base font-extrabold text-[var(--foreground)]">
                  {step.label}
                </span>
                <span className="text-sm leading-6 text-[var(--muted)]">{step.detail}</span>
              </Link>
            ))}
          </div>
        </div>

        <aside className="grid content-start gap-4">
          <InfoCard
            action={{ href: "/teams", label: "팀빌더로 이동" }}
            description="팀빌더 안에서 기술, 특성, 도구, 능력보정, HABCDS 사용률을 참고 신호로 확인합니다."
            title="사용률은 판단 보조"
          >
            <div className="flex flex-wrap gap-2">
              <Badge tone="success">기술</Badge>
              <Badge tone="success">특성</Badge>
              <Badge tone="success">도구</Badge>
              <Badge tone="neutral">HABCDS</Badge>
            </div>
          </InfoCard>

          <InfoCard description="보조 페이지는 카드보다 짧은 리스트로 유지해 빠른 이동에 집중합니다." title="보조 도구">
            <div className="divide-y divide-[var(--panel-border)]">
              {supportLinks.map((link) => (
                <Link
                  className="flex min-h-12 items-center justify-between gap-3 py-3 text-sm hover:text-[var(--support-strong)]"
                  href={link.href}
                  key={link.href}
                >
                  <span className="font-extrabold text-[var(--foreground)]">{link.label}</span>
                  <span className="text-right text-[var(--muted)]">{link.value}</span>
                </Link>
              ))}
            </div>
          </InfoCard>
        </aside>
      </section>
    </AppShell>
  );
}
