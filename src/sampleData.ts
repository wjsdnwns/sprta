import { Segment, SnowEvent } from "./types";

/**
 * ⚠️ 아래 18개 구간은 전부 예시(placeholder) 데이터다.
 * 도로명은 은평구·서대문구·마포구의 실제 도로명을 사용했으나,
 * 좌표(x, y)는 지도 배치를 위한 개략값이며 OA-22904(서울시 가로수 위치정보)의
 * 실제 위경도가 아니다. 수종·도로종류·지형·수량·길이도 검증 전 예시값이다.
 * 실제 서비스 전 반드시 다음으로 교체할 것:
 *   - 좌표/수종/수량: 서울시 가로수 위치정보 (OA-22904)
 *   - 도로종류/길이: 은평구·전국 가로수길 정보 (data.go.kr 15133599 / 15021145)
 */
export const SAMPLE_SEGMENTS: Segment[] = [
  { id: "ep-1", gu: "은평구", roadName: "통일로", roadType: "간선", species: "이팝나무", terrain: "응달저지대", treeCount: 180, lengthM: 1600, x: 8, y: 10 },
  { id: "ep-2", gu: "은평구", roadName: "연서로", roadType: "보조간선", species: "은행나무", terrain: "평지", treeCount: 120, lengthM: 1200, x: 18, y: 8 },
  { id: "ep-3", gu: "은평구", roadName: "진관2로", roadType: "이면", species: "느티나무", terrain: "응달저지대", treeCount: 60, lengthM: 500, x: 28, y: 18 },
  { id: "ep-4", gu: "은평구", roadName: "은평로", roadType: "보조간선", species: "왕벚나무", terrain: "평지", treeCount: 95, lengthM: 900, x: 12, y: 28 },
  { id: "ep-5", gu: "은평구", roadName: "갈현로", roadType: "이면", species: "양버즘나무", terrain: "경사배수양호", treeCount: 50, lengthM: 400, x: 24, y: 30 },
  { id: "ep-6", gu: "은평구", roadName: "증산로", roadType: "간선", species: "은행나무", terrain: "평지", treeCount: 140, lengthM: 1300, x: 32, y: 22 },

  { id: "sd-1", gu: "서대문구", roadName: "연희로", roadType: "간선", species: "왕벚나무", terrain: "평지", treeCount: 160, lengthM: 1500, x: 40, y: 35 },
  { id: "sd-2", gu: "서대문구", roadName: "신촌로", roadType: "간선", species: "이팝나무", terrain: "응달저지대", treeCount: 110, lengthM: 1000, x: 50, y: 32 },
  { id: "sd-3", gu: "서대문구", roadName: "홍제천로", roadType: "이면", species: "느티나무", terrain: "경사배수양호", treeCount: 45, lengthM: 350, x: 36, y: 45 },
  { id: "sd-4", gu: "서대문구", roadName: "세검정로", roadType: "보조간선", species: "은행나무", terrain: "응달저지대", treeCount: 80, lengthM: 700, x: 44, y: 40 },
  { id: "sd-5", gu: "서대문구", roadName: "독립문로", roadType: "보조간선", species: "양버즘나무", terrain: "평지", treeCount: 90, lengthM: 800, x: 54, y: 48 },
  { id: "sd-6", gu: "서대문구", roadName: "성산로", roadType: "간선", species: "왕벚나무", terrain: "평지", treeCount: 130, lengthM: 1200, x: 58, y: 42 },

  { id: "mp-1", gu: "마포구", roadName: "월드컵로", roadType: "간선", species: "은행나무", terrain: "평지", treeCount: 170, lengthM: 1600, x: 66, y: 55 },
  { id: "mp-2", gu: "마포구", roadName: "마포대로", roadType: "간선", species: "양버즘나무", terrain: "평지", treeCount: 200, lengthM: 1800, x: 74, y: 62 },
  { id: "mp-3", gu: "마포구", roadName: "양화로", roadType: "간선", species: "이팝나무", terrain: "경사배수양호", treeCount: 150, lengthM: 1400, x: 80, y: 70 },
  { id: "mp-4", gu: "마포구", roadName: "토정로", roadType: "보조간선", species: "느티나무", terrain: "경사배수양호", treeCount: 70, lengthM: 600, x: 70, y: 75 },
  { id: "mp-5", gu: "마포구", roadName: "백범로", roadType: "보조간선", species: "왕벚나무", terrain: "평지", treeCount: 100, lengthM: 900, x: 84, y: 80 },
  { id: "mp-6", gu: "마포구", roadName: "와우산로", roadType: "이면", species: "은행나무", terrain: "경사배수양호", treeCount: 55, lengthM: 450, x: 90, y: 88 },
];

/**
 * ⚠️ 예시 강설 기록 4건. 실제 서비스 전 ASOS 서울(108) 2025-12-01~2026-02-28
 * 일자료(최저기온·일강수량·일 최심신적설)로 교체할 것. 결측(무강설일)은 0으로 채운다.
 */
export const SAMPLE_EVENTS: SnowEvent[] = [
  { id: "ev-1", date: "2025-12-18", minTempC: -3.0, newSnowCm: 4.0, precipMm: 3.0 },
  { id: "ev-2", date: "2026-01-05", minTempC: -8.5, newSnowCm: 7.5, precipMm: 1.0 },
  { id: "ev-3", date: "2026-01-22", minTempC: -1.0, newSnowCm: 2.0, precipMm: 8.0 },
  { id: "ev-4", date: "2026-02-10", minTempC: -11.0, newSnowCm: 3.0, precipMm: 0.0 },
];
