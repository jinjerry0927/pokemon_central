import Link from "next/link";
import { AppShell, InfoCard, PageHeader } from "../_components/design-system";
import { createPageMetadata } from "../_lib/seo";

export const metadata = createPageMetadata({
  title: "About",
  description: "Pokemon Central의 운영 범위, 팬메이드 고지, 데이터와 자산 사용 정책을 확인합니다.",
  path: "/about"
});

const notices = [
  {
    title: "팬메이드 고지",
    description:
      "Pokemon Central은 Pokemon Champions를 플레이하는 한국어 유저를 위한 비공식 팬메이드 공략 사이트입니다. Pokemon Champions, Pokemon, 관련 상표와 저작물의 공식 서비스가 아닙니다."
  },
  {
    title: "데이터 운영 범위",
    description:
      "도감, 빌드, 팀, 계산기 기본값은 공개 가능한 출처를 교차 확인하거나 수동 큐레이션한 샘플 데이터만 사용합니다. 출처가 불명확한 정보는 공개 페이지에 사용하지 않습니다."
  },
  {
    title: "이미지와 스프라이트 정책",
    description:
      "공식 이미지, 스프라이트, 아이콘은 사용 정책을 확인하기 전까지 사이트 핵심 UI에 포함하지 않습니다. MVP에서는 텍스트, 배지, 임시 UI를 우선 사용합니다."
  }
];

export default function AboutPage() {
  return (
    <AppShell>
      <PageHeader
        description="Pokemon Central은 공식 서비스가 아닌 한국어 팬 공략 허브입니다. 공개 데이터와 UI 자산은 확인 가능한 범위 안에서만 사용합니다."
        eyebrow="About"
        title="운영 범위와 팬메이드 고지"
      />

      <section className="mx-auto grid max-w-7xl gap-4 px-6 py-8 lg:grid-cols-3 lg:px-10">
        {notices.map((notice) => (
          <InfoCard description={notice.description} key={notice.title} title={notice.title} />
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10 lg:px-10">
        <InfoCard
          action={{ href: "/sources", label: "출처 보기" }}
          description="현재 데이터 출처와 사용 범위는 별도 페이지에서 확인할 수 있습니다."
          title="데이터 출처"
        >
          <p className="text-sm leading-6 text-[var(--muted)]">
            외부 출처의 긴 설명은 복사하지 않고, Pokemon Champions 환경에 맞게 짧게 요약하거나
            수동 큐레이션 메모로 분리합니다.
          </p>
        </InfoCard>
        <Link className="mt-6 inline-block text-sm font-semibold text-[var(--accent)]" href="/">
          Pokemon Central 홈으로 돌아가기
        </Link>
      </section>
    </AppShell>
  );
}
