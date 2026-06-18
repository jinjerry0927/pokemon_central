const featureCards = [
  {
    title: "도감",
    description: "포켓몬별 타입, 역할, 주요 기술, 추천 빌드로 빠르게 이동합니다."
  },
  {
    title: "빌드",
    description: "성격, 노력치, 기술, 아이템과 운영 포인트를 한 화면에서 확인합니다."
  },
  {
    title: "팀빌더",
    description: "6마리 조합의 타입 약점과 역할 균형을 로컬 저장 기준으로 점검합니다."
  },
  {
    title: "스피드 티어",
    description: "랭크전에서 자주 만나는 속도 기준을 검색하고 비교합니다."
  },
  {
    title: "데미지 계산기",
    description: "공격자, 방어자, 기술을 고르고 초보자가 읽기 쉬운 결과를 제공합니다."
  },
  {
    title: "가이드",
    description: "Pokemon Champions 입문과 첫 랭크 준비에 필요한 글을 연결합니다."
  }
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="border-b border-[var(--panel-border)] bg-[var(--panel)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:py-16">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
              Pokemon Champions Guide Web
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight text-[var(--foreground)] lg:text-6xl">
              한국어로 빠르게 찾는 포켓몬 공략 허브
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">
              도감, 추천 빌드, 팀빌더, 스피드 티어, 데미지 계산을 하나의 흐름으로
              연결하는 데스크톱 우선 MVP입니다.
            </p>
          </div>
          <div className="grid content-center gap-3 rounded-lg border border-[var(--panel-border)] bg-[var(--background)] p-5">
            <div className="flex items-center justify-between border-b border-[var(--panel-border)] pb-3">
              <span className="text-sm font-semibold text-[var(--muted)]">MVP 상태</span>
              <span className="rounded bg-[var(--accent)] px-2 py-1 text-xs font-bold text-white">
                Phase C
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {["Static export", "TypeScript", "Tailwind CSS", "Local data"].map(
                (item) => (
                  <div
                    className="rounded-md border border-[var(--panel-border)] bg-white px-3 py-4 text-sm font-semibold"
                    key={item}
                  >
                    {item}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featureCards.map((feature) => (
            <article
              className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5"
              key={feature.title}
            >
              <h2 className="text-xl font-bold">{feature.title}</h2>
              <p className="mt-3 leading-7 text-[var(--muted)]">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
