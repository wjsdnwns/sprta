import React, { useMemo, useState } from "react";
import MapView from "./MapView";
import { SAMPLE_EVENTS, SAMPLE_SEGMENTS } from "./sampleData";
import { evaluateSegments, PHASE_LAMBDA, QUINTILE_COLORS, QUINTILE_LABELS } from "./rsiModel";
import { Phase, SnowEvent } from "./types";

const PHASES: Phase[] = ["12월", "1-2월", "3월", "4월이후"];

let nextEventSeq = SAMPLE_EVENTS.length + 1;

function App() {
  const [events, setEvents] = useState<SnowEvent[]>(SAMPLE_EVENTS);
  const [phase, setPhase] = useState<Phase>("3월");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const results = useMemo(() => evaluateSegments(SAMPLE_SEGMENTS, events, phase), [events, phase]);
  const selected = results.find((r) => r.segment.id === selectedId) ?? null;

  const updateEvent = (id: string, patch: Partial<SnowEvent>) => {
    setEvents((prev) => prev.map((ev) => (ev.id === id ? { ...ev, ...patch } : ev)));
  };

  const removeEvent = (id: string) => {
    setEvents((prev) => prev.filter((ev) => ev.id !== id));
  };

  const addEvent = () => {
    const id = `ev-new-${nextEventSeq++}`;
    setEvents((prev) => [...prev, { id, date: "2026-01-01", minTempC: -5, newSnowCm: 3, precipMm: 0 }]);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>가로수 염해 위험 지도 (프로토타입)</h1>
        <p className="subtitle">
          은평구 · 서대문구 · 마포구 — 강설·기온에서 추정한 제설제 노출이 3월에 발현되는 상대 위험도
        </p>
        <div className="banner">
          ⚠️ 이 화면의 좌표·강설기록·상수는 전부 <strong>예시(placeholder) 데이터</strong>입니다.
          실제 가로수 위치, ASOS 관측값, 문헌 확정 상수로 교체되기 전까지는 구조 검증용입니다.
          출력은 <strong>절대 피해 확률이 아니라 관내 상대 순위(5분위)</strong>입니다.
        </div>
      </header>

      <main className="layout">
        <aside className="panel controls">
          <section>
            <h2>발현 시점</h2>
            <div className="phase-buttons">
              {PHASES.map((p) => (
                <button
                  key={p}
                  className={p === phase ? "phase-btn active" : "phase-btn"}
                  onClick={() => setPhase(p)}
                >
                  {p}
                  <span className="phase-lambda">Λ={PHASE_LAMBDA[p]}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="section-head">
              <h2>강설 기록 (예시)</h2>
              <button className="add-btn" onClick={addEvent}>
                + 행 추가
              </button>
            </div>
            <table className="event-table">
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>최저기온℃</th>
                  <th>신적설cm</th>
                  <th>강수mm</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.id}>
                    <td>
                      <input
                        type="date"
                        value={ev.date}
                        onChange={(e) => updateEvent(ev.id, { date: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.1"
                        value={ev.minTempC}
                        onChange={(e) => updateEvent(ev.id, { minTempC: Number(e.target.value) })}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.1"
                        min={0}
                        value={ev.newSnowCm}
                        onChange={(e) => updateEvent(ev.id, { newSnowCm: Number(e.target.value) })}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.1"
                        min={0}
                        value={ev.precipMm}
                        onChange={(e) => updateEvent(ev.id, { precipMm: Number(e.target.value) })}
                      />
                    </td>
                    <td>
                      <button className="remove-btn" onClick={() => removeEvent(ev.id)} aria-label="삭제">
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h2>범례 (관내 상대 5분위)</h2>
            <ul className="legend">
              {[5, 4, 3, 2, 1].map((q) => (
                <li key={q}>
                  <span className="swatch" style={{ background: QUINTILE_COLORS[q as 1 | 2 | 3 | 4 | 5] }} />
                  {QUINTILE_LABELS[q as 1 | 2 | 3 | 4 | 5]}
                </li>
              ))}
              <li>
                <span className="swatch swatch-none" />
                데이터 부족 (순위 산출 불가)
              </li>
            </ul>
          </section>
        </aside>

        <section className="panel map-panel">
          <h2>
            실제 지도 <span className="hint">(OpenStreetMap · 구간 좌표는 도로 대표 지점 근사치)</span>
          </h2>
          <MapView results={results} selectedId={selectedId} onSelect={setSelectedId} />
        </section>

        <aside className="panel detail-panel">
          <h2>구간 상세</h2>
          {selected ? (
            <div className="detail-body">
              <h3>
                {selected.segment.gu} · {selected.segment.roadName}
              </h3>
              <dl>
                <dt>도로종류</dt>
                <dd>{selected.segment.roadType}</dd>
                <dt>수종</dt>
                <dd>{selected.segment.species}</dd>
                <dt>지형</dt>
                <dd>{selected.segment.terrain}</dd>
                <dt>가로수 수량</dt>
                <dd>{selected.segment.treeCount}주</dd>
                <dt>구간 길이</dt>
                <dd>{selected.segment.lengthM}m</dd>
              </dl>
              <div className="rsi-breakdown">
                <div>
                  누적 스트레스 C<sub>t</sub> = {selected.accumulatedStress.toFixed(2)}
                </div>
                <div>
                  노출량 E<sub>i</sub> = {selected.exposure.toFixed(2)}
                </div>
                <div>
                  RSI<sub>i</sub>({phase}) = {selected.rsi.toFixed(2)}
                </div>
                {selected.quintile ? (
                  <div className="quintile-tag" style={{ background: QUINTILE_COLORS[selected.quintile] }}>
                    관내 상위 {(100 - selected.percentile).toFixed(0)}% ({QUINTILE_LABELS[selected.quintile]})
                  </div>
                ) : (
                  <div className="quintile-tag none">순위 산출 불가 (강설 기록 없음)</div>
                )}
              </div>
            </div>
          ) : (
            <p className="empty-hint">지도에서 구간(원)을 클릭하면 상세 계산값을 볼 수 있습니다.</p>
          )}
        </aside>
      </main>

      <footer className="app-footer">
        <div className="footer-col">
          <h3>반드시 지킬 원칙</h3>
          <ul>
            <li>절대 확률이 아닌 상대 순위(5분위)만 출력한다.</li>
            <li>격자 전체를 칠하는 히트맵을 만들지 않는다 — 가로수 점에만 색을 입힌다.</li>
            <li>출처 없는 상수는 넣지 않는다 — 확정 전까지 [잠정]으로 표시한다.</li>
            <li>제설제 사용량은 월·시군 단위라 5km 격자와 해상도가 맞지 않는 외삽값이다.</li>
            <li>가로수 위치정보는 공공누리 4유형(변경금지) — 가공물 공개 전 서울시 조경과 확인 필요.</li>
          </ul>
        </div>
        <div className="footer-col">
          <h3>실제 데이터로 교체 필요</h3>
          <ul>
            <li>강설 기록 → ASOS 서울(108) 2025-12~2026-02 일자료</li>
            <li>구간 좌표·수종·수량 → 서울시 가로수 위치정보 (OA-22904)</li>
            <li>도로종류·길이 → 은평구/전국 가로수길 정보 (data.go.kr)</li>
            <li>β, λ, 도로등급·지형 계수 → 문헌 확정치 또는 실측 보정</li>
            <li>제설함 근접도 D<sub>i</sub> → 서울시 제설함 위치정보 (OA-22648), 현재 미적용(1.0)</li>
          </ul>
        </div>
      </footer>
    </div>
  );
}

export default App;
