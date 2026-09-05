export type Gu = "은평구" | "서대문구" | "마포구";

export type RoadType = "간선" | "보조간선" | "이면";

export type Species = "이팝나무" | "왕벚나무" | "느티나무" | "은행나무" | "양버즘나무";

export type Terrain = "응달저지대" | "평지" | "경사배수양호";

export type Phase = "12월" | "1-2월" | "3월" | "4월이후";

/**
 * 가로수 구간. x/y는 실제 위경도가 아니라 지도 상 배치를 위한 개략(0~100) 좌표다.
 * 실제 서비스 전에는 OA-22904(서울시 가로수 위치정보)의 위경도로 교체해야 한다.
 */
export interface Segment {
  id: string;
  gu: Gu;
  roadName: string;
  roadType: RoadType;
  species: Species;
  terrain: Terrain;
  treeCount: number;
  lengthM: number;
  x: number;
  y: number;
}

/**
 * 강설/기상 이벤트 1건. ASOS 서울(108) 일자료 스키마를 따른다.
 * newSnowCm(일 최심신적설)이 없는 날은 0으로 취급한다 (기상청은 결측으로 표기).
 */
export interface SnowEvent {
  id: string;
  date: string; // YYYY-MM-DD
  minTempC: number;
  newSnowCm: number;
  precipMm: number;
}

export interface SegmentResult {
  segment: Segment;
  accumulatedStress: number; // C_t
  exposure: number; // E_i
  rsi: number; // RSI_i(t)
  percentile: number; // 0~100, 관내 상대 순위
  quintile: 1 | 2 | 3 | 4 | 5 | null; // null = 이벤트 없어 순위 산출 불가
}
