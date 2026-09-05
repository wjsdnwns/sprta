// RSI (Road-salt Stress Index) 계산 모듈.
// 수식과 상수의 근거는 인수인계 문서 5절을 그대로 따른다.
// [잠정] 표시가 붙은 값은 문헌 확정치가 아니라 구조 검증용 임시값이며,
// 실측 보정 전에는 웹에도 동일하게 [잠정]으로 노출해야 한다 (원칙 3).

import { Phase, RoadType, Segment, SegmentResult, Species, SnowEvent, Terrain } from "./types";

// NaCl은 약 -9.4℃(화씨 15도) 아래로 내려가면 용해가 어려워 효력을 잃는다.
// 출처: New Hampshire DES, Road Salt and Water Quality Fact Sheet WMB-4.
const NACL_INEFFECTIVE_TEMP_C = -9.4;

// 저온일수록 살포량이 느는 정도. [잠정]
const BETA = 0.5;

// 강수에 의한 세척(leaching) 계수. λ=0.02/mm ⇒ 강수 약 35mm에서 절반 세척. [잠정]
const LAMBDA = 0.02;

// 도로등급별 살포 강도 가중치. [잠정]
export const ROAD_TYPE_COEF: Record<RoadType, number> = {
  간선: 1.0,
  보조간선: 0.7,
  이면: 0.4,
};

// 수종별 제설제 민감도. 이팝나무·왕벚나무는 산림과학원 피해 확인 수종,
// 은행나무·양버즘나무는 UMass 내염성 목록 수종(단, 은행나무는 피해 사례도 보고됨).
export const SPECIES_SENSITIVITY: Record<Species, number> = {
  이팝나무: 1.4,
  왕벚나무: 1.2,
  느티나무: 1.0,
  은행나무: 0.8,
  양버즘나무: 0.7,
};

// 지형(응달·배수) 계수. [잠정]
export const TERRAIN_COEF: Record<Terrain, number> = {
  응달저지대: 1.3,
  평지: 1.0,
  경사배수양호: 0.8,
};

// 발현 시차 가중치 Λ(t). 국립산림과학원 관찰(3월 발현)에 근거해 월별로 조정.
export const PHASE_LAMBDA: Record<Phase, number> = {
  "12월": 0.3,
  "1-2월": 0.6,
  "3월": 1.0,
  "4월이후": 0.7,
};

// 제설함 근접도 D_i. 데이터 미확보로 프로토타입에서는 1.0(미적용) 고정.
const PROXIMITY_UNAPPLIED = 1.0;

/** φ(T): 기온에 따른 살포 효율 계수 */
export function sprayEfficiency(minTempC: number): number {
  if (minTempC >= 2) return 0;
  if (minTempC >= 0) return 0.5;
  if (minTempC >= NACL_INEFFECTIVE_TEMP_C) {
    return 1 + (BETA * -minTempC) / -NACL_INEFFECTIVE_TEMP_C;
  }
  return 0.6;
}

/** S_d = SNO_d × φ(T_d) × R_j : 구간별 일일 살포 강도 추정 */
function dailySprayIntensity(event: SnowEvent, roadType: RoadType): number {
  return event.newSnowCm * sprayEfficiency(event.minTempC) * ROAD_TYPE_COEF[roadType];
}

/**
 * C_t = C_{t-1} × e^(−λ·P_t) + S_t : 누적과 세척.
 * events는 날짜순으로 정렬되어 있어야 한다. C_0 = 0 (겨울 시즌 시작 시 초기화).
 */
export function accumulateStress(events: SnowEvent[], roadType: RoadType): number {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  let c = 0;
  for (const event of sorted) {
    c = c * Math.exp(-LAMBDA * event.precipMm) + dailySprayIntensity(event, roadType);
  }
  return c;
}

/** E_i = C_t × V_s × G_i × D_i : 공간·수종 가중 노출량 */
export function computeExposure(accumulatedStress: number, species: Species, terrain: Terrain): number {
  return accumulatedStress * SPECIES_SENSITIVITY[species] * TERRAIN_COEF[terrain] * PROXIMITY_UNAPPLIED;
}

/** RSI_i(t) = E_i × Λ(t) : 발현 시차 반영 */
export function computeRSI(exposure: number, phase: Phase): number {
  return exposure * PHASE_LAMBDA[phase];
}

/**
 * 관내 전체 구간의 RSI를 계산하고 상대 순위(5분위)로 변환한다.
 * 원칙에 따라 절대 확률이 아닌 percentile/quintile만 반환한다.
 */
export function evaluateSegments(segments: Segment[], events: SnowEvent[], phase: Phase): SegmentResult[] {
  const hasEvents = events.length > 0;

  const partial = segments.map((segment) => {
    const accumulatedStress = accumulateStress(events, segment.roadType);
    const exposure = computeExposure(accumulatedStress, segment.species, segment.terrain);
    const rsi = computeRSI(exposure, phase);
    return { segment, accumulatedStress, exposure, rsi };
  });

  const n = partial.length;
  const order = [...partial].sort((a, b) => a.rsi - b.rsi);
  const rankById = new Map<string, number>();
  order.forEach((item, idx) => rankById.set(item.segment.id, idx));

  const allEqual = hasEvents && order.every((item) => item.rsi === order[0].rsi);

  return partial.map((item): SegmentResult => {
    if (!hasEvents || allEqual) {
      return { ...item, percentile: 0, quintile: null };
    }
    const rank = rankById.get(item.segment.id)!;
    const percentile = ((rank + 1) / n) * 100;
    const quintile = Math.min(5, Math.max(1, Math.ceil(percentile / 20))) as 1 | 2 | 3 | 4 | 5;
    return { ...item, percentile, quintile };
  });
}

export const QUINTILE_COLORS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "#2f9e44",
  2: "#82c91e",
  3: "#f5b800",
  4: "#f76707",
  5: "#e03131",
};

export const QUINTILE_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "하위 20% (관내 최저)",
  2: "20~40%",
  3: "40~60%",
  4: "60~80%",
  5: "상위 20% (관내 최고)",
};
