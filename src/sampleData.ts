import { Segment, SnowEvent } from "./types";

/**
 * ⚠️ 아래 18개 구간은 전부 예시(placeholder) 데이터다.
 * 도로명은 은평구·서대문구·마포구의 실제 도로명을 사용했고, lat/lng도 해당 도로가
 * 지나는 실제 지점의 근사 좌표(대략적인 지도상 위치, 지도 API 렌더링 확인용)를 썼다.
 * 그러나 이는 여전히 도로 대표 지점일 뿐 개별 가로수의 실측 좌표가 아니다.
 * 수종·도로종류·지형·수량·길이도 검증 전 예시값이다.
 * 실제 서비스 전 반드시 다음으로 교체할 것:
 *   - 가로수별 좌표/수종/수량: 서울시 가로수 위치정보 (OA-22904)
 *   - 도로종류/길이: 은평구·전국 가로수길 정보 (data.go.kr 15133599 / 15021145)
 */
export const SAMPLE_SEGMENTS: Segment[] = [
  { id: "ep-1", gu: "은평구", roadName: "통일로", roadType: "간선", species: "이팝나무", terrain: "응달저지대", treeCount: 180, lengthM: 1600, lat: 37.6396, lng: 126.9269 },
  { id: "ep-2", gu: "은평구", roadName: "연서로", roadType: "보조간선", species: "은행나무", terrain: "평지", treeCount: 120, lengthM: 1200, lat: 37.6180, lng: 126.9150 },
  { id: "ep-3", gu: "은평구", roadName: "진관2로", roadType: "이면", species: "느티나무", terrain: "응달저지대", treeCount: 60, lengthM: 500, lat: 37.6390, lng: 126.9490 },
  { id: "ep-4", gu: "은평구", roadName: "은평로", roadType: "보조간선", species: "왕벚나무", terrain: "평지", treeCount: 95, lengthM: 900, lat: 37.5990, lng: 126.9160 },
  { id: "ep-5", gu: "은평구", roadName: "갈현로", roadType: "이면", species: "양버즘나무", terrain: "경사배수양호", treeCount: 50, lengthM: 400, lat: 37.6180, lng: 126.9130 },
  { id: "ep-6", gu: "은평구", roadName: "증산로", roadType: "간선", species: "은행나무", terrain: "평지", treeCount: 140, lengthM: 1300, lat: 37.5800, lng: 126.9100 },

  { id: "sd-1", gu: "서대문구", roadName: "연희로", roadType: "간선", species: "왕벚나무", terrain: "평지", treeCount: 160, lengthM: 1500, lat: 37.5720, lng: 126.9330 },
  { id: "sd-2", gu: "서대문구", roadName: "신촌로", roadType: "간선", species: "이팝나무", terrain: "응달저지대", treeCount: 110, lengthM: 1000, lat: 37.5596, lng: 126.9370 },
  { id: "sd-3", gu: "서대문구", roadName: "홍제천로", roadType: "이면", species: "느티나무", terrain: "경사배수양호", treeCount: 45, lengthM: 350, lat: 37.5890, lng: 126.9440 },
  { id: "sd-4", gu: "서대문구", roadName: "세검정로", roadType: "보조간선", species: "은행나무", terrain: "응달저지대", treeCount: 80, lengthM: 700, lat: 37.5980, lng: 126.9550 },
  { id: "sd-5", gu: "서대문구", roadName: "독립문로", roadType: "보조간선", species: "양버즘나무", terrain: "평지", treeCount: 90, lengthM: 800, lat: 37.5730, lng: 126.9580 },
  { id: "sd-6", gu: "서대문구", roadName: "성산로", roadType: "간선", species: "왕벚나무", terrain: "평지", treeCount: 130, lengthM: 1200, lat: 37.5860, lng: 126.9280 },

  { id: "mp-1", gu: "마포구", roadName: "월드컵로", roadType: "간선", species: "은행나무", terrain: "평지", treeCount: 170, lengthM: 1600, lat: 37.5680, lng: 126.8970 },
  { id: "mp-2", gu: "마포구", roadName: "마포대로", roadType: "간선", species: "양버즘나무", terrain: "평지", treeCount: 200, lengthM: 1800, lat: 37.5490, lng: 126.9520 },
  { id: "mp-3", gu: "마포구", roadName: "양화로", roadType: "간선", species: "이팝나무", terrain: "경사배수양호", treeCount: 150, lengthM: 1400, lat: 37.5490, lng: 126.9140 },
  { id: "mp-4", gu: "마포구", roadName: "토정로", roadType: "보조간선", species: "느티나무", terrain: "경사배수양호", treeCount: 70, lengthM: 600, lat: 37.5420, lng: 126.9450 },
  { id: "mp-5", gu: "마포구", roadName: "백범로", roadType: "보조간선", species: "왕벚나무", terrain: "평지", treeCount: 100, lengthM: 900, lat: 37.5450, lng: 126.9570 },
  { id: "mp-6", gu: "마포구", roadName: "와우산로", roadType: "이면", species: "은행나무", terrain: "경사배수양호", treeCount: 55, lengthM: 450, lat: 37.5490, lng: 126.9250 },
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
