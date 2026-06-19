"use client";

import { useMemo, useState } from "react";
import { Badge, FilterBar, InfoCard } from "../_components/design-system";
import {
  allTypes,
  formatMultiplier,
  getAttackMultiplier,
  getDefensiveProfile,
  type TypeName
} from "../_lib/type-matchups";

function getMultiplierTone(multiplier: number) {
  if (multiplier === 0) {
    return "neutral";
  }
  if (multiplier > 1) {
    return "warning";
  }
  if (multiplier < 1) {
    return "success";
  }

  return "support";
}

function getDefenseGroups(profile: ReturnType<typeof getDefensiveProfile>) {
  return {
    weak: profile.filter((item) => item.multiplier > 1),
    resist: profile.filter((item) => item.multiplier > 0 && item.multiplier < 1),
    immune: profile.filter((item) => item.multiplier === 0)
  };
}

export function TypeChartBrowser() {
  const [primaryType, setPrimaryType] = useState<TypeName>("Fire");
  const [secondaryType, setSecondaryType] = useState<TypeName | "없음">("Flying");
  const defenderTypes = useMemo(
    () => (secondaryType === "없음" ? [primaryType] : [primaryType, secondaryType]),
    [primaryType, secondaryType]
  );
  const defensiveProfile = useMemo(() => getDefensiveProfile(defenderTypes), [defenderTypes]);
  const defenseGroups = useMemo(() => getDefenseGroups(defensiveProfile), [defensiveProfile]);

  return (
    <section className="mx-auto grid max-w-7xl gap-4 px-6 py-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-10">
      <aside className="grid content-start gap-4">
        <InfoCard title="방어 타입 선택">
          <div className="grid gap-5">
            <FilterBar
              label="첫 번째 타입"
              onSelect={(label) => setPrimaryType(label as TypeName)}
              options={allTypes.map((type) => ({
                label: type,
                active: type === primaryType
              }))}
            />
            <FilterBar
              label="두 번째 타입"
              onSelect={(label) => setSecondaryType(label as TypeName | "없음")}
              options={["없음", ...allTypes].map((type) => ({
                label: type,
                active: type === secondaryType
              }))}
            />
          </div>
        </InfoCard>

        <InfoCard title="선택 타입">
          <div className="flex flex-wrap gap-2">
            {defenderTypes.map((type) => (
              <Badge key={type} tone="type">
                {type}
              </Badge>
            ))}
          </div>
        </InfoCard>
      </aside>

      <div className="grid gap-4">
        <div className="grid gap-4 xl:grid-cols-3">
          <InfoCard title="약점">
            <div className="flex flex-wrap gap-2">
              {defenseGroups.weak.map((item) => (
                <Badge key={item.type} tone="warning">
                  {item.type} {formatMultiplier(item.multiplier)}
                </Badge>
              ))}
            </div>
          </InfoCard>

          <InfoCard title="반감">
            <div className="flex flex-wrap gap-2">
              {defenseGroups.resist.map((item) => (
                <Badge key={item.type} tone="success">
                  {item.type} {formatMultiplier(item.multiplier)}
                </Badge>
              ))}
            </div>
          </InfoCard>

          <InfoCard title="무효">
            {defenseGroups.immune.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {defenseGroups.immune.map((item) => (
                  <Badge key={item.type}>{item.type}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm font-semibold text-[var(--muted)]">무효 상성이 없습니다.</p>
            )}
          </InfoCard>
        </div>

        <InfoCard title="공격 상성표">
          <div className="overflow-x-auto">
            <table className="min-w-[880px] border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-[var(--panel)] px-2 py-2 text-left font-bold text-[var(--muted)]">
                    공격
                  </th>
                  {allTypes.map((defenderType) => (
                    <th
                      className="border-b border-[var(--panel-border)] px-2 py-2 text-center font-bold text-[var(--muted)]"
                      key={defenderType}
                    >
                      {defenderType}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allTypes.map((attackingType) => (
                  <tr key={attackingType}>
                    <th className="sticky left-0 z-10 border-b border-[var(--panel-border)] bg-[var(--panel)] px-2 py-2 text-left font-bold">
                      {attackingType}
                    </th>
                    {allTypes.map((defenderType) => {
                      const multiplier = getAttackMultiplier(attackingType, defenderType);

                      return (
                        <td
                          className="border-b border-[var(--panel-border)] px-1 py-1 text-center"
                          key={defenderType}
                        >
                          <span
                            className={`inline-flex h-8 min-w-12 items-center justify-center rounded-md text-xs font-bold ${
                              getMultiplierTone(multiplier) === "warning"
                                ? "bg-[var(--warning-soft)] text-[var(--warning-strong)]"
                                : getMultiplierTone(multiplier) === "success"
                                  ? "bg-[var(--success-soft)] text-[var(--success-strong)]"
                                  : getMultiplierTone(multiplier) === "neutral"
                                    ? "bg-[var(--chip)] text-[var(--muted)]"
                                    : "bg-white text-[var(--foreground)]"
                            }`}
                          >
                            {formatMultiplier(multiplier)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </InfoCard>
      </div>
    </section>
  );
}
