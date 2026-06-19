import { SectionPage } from "../../_components/section-page";

type GuideRoute = {
  params: Promise<{
    slug: string;
  }>;
};

const guideSlugs = [
  "starter-guide",
  "first-ranked-team",
  "type-chart-basics",
  "speed-tier-basics",
  "damage-calculator-basics"
];

export function generateStaticParams() {
  return guideSlugs.map((slug) => ({
    slug
  }));
}

export default async function GuideDetailPage({ params }: GuideRoute) {
  const { slug } = await params;

  return (
    <SectionPage
      description="공략 본문과 관련 도감, 빌드, 계산기 링크를 연결하는 글 상세 페이지입니다."
      eyebrow="Guide Detail"
      items={["본문", "관련 도감", "관련 빌드", "관련 도구"]}
      title={slug}
    />
  );
}
