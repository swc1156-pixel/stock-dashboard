import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  Area,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  BarChart,
  Legend,
  ReferenceLine
} from 'recharts';
import axios from 'axios';

// Vite 환경 변수에서 서버 주소를 가져오거나, 없으면 내 컴퓨터 로컬 주소 사용
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const DEFAULT_SYMBOLS = [
  'GOOGL'
];

const CHART_TABS = [
  { label: '15분봉', interval: '15m' },
  { label: '30분봉', interval: '30m' },
  { label: '60분봉', interval: '60m' },
  { label: '일봉', interval: '1d' },
  { label: '주봉', interval: '1wk' },
  { label: '월봉', interval: '1mo' }
];

const MARKET_EXPLORER_CARDS = [
  { 
    id: 'KOSPI', 
    icon: (
      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', borderRadius: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #3b82f6', boxShadow: '0 4px 12px rgba(30, 58, 138, 0.4)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '30px', height: '30px', background: 'radial-gradient(circle, rgba(96,165,250,0.4) 0%, transparent 70%)', borderRadius: '50%' }}></div>
        <span style={{ fontSize: '17px', fontWeight: '900', letterSpacing: '0.5px', color: '#eff6ff' }}>KR</span>
        <span style={{ fontSize: '8px', fontWeight: '700', color: '#93c5fd', marginTop: '1px' }}>KOSPI</span>
      </div>
    ), 
    title: '코스피 (KOSPI)', 
    modalTitle: '코스피 (KOSPI) 전체 종목',
    desc: '국내 시장 대표 우량주 전체' 
  },
  { 
    id: 'KOSDAQ', 
    icon: (
      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%)', borderRadius: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #8b5cf6', boxShadow: '0 4px 12px rgba(76, 29, 149, 0.4)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '30px', height: '30px', background: 'radial-gradient(circle, rgba(167,139,250,0.4) 0%, transparent 70%)', borderRadius: '50%' }}></div>
        <span style={{ fontSize: '17px', fontWeight: '900', letterSpacing: '0.5px', color: '#f5f3ff' }}>KR</span>
        <span style={{ fontSize: '8px', fontWeight: '700', color: '#c4b5fd', marginTop: '1px' }}>KOSDAQ</span>
      </div>
    ), 
    title: '코스닥 (KOSDAQ)', 
    modalTitle: '코스닥 (KOSDAQ) 전체 종목',
    desc: '국내 기술/성장주 전체' 
  },
  { 
    id: 'NASDAQ', 
    icon: (
      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #022c22 0%, #065f46 100%)', borderRadius: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #10b981', boxShadow: '0 4px 12px rgba(6, 95, 70, 0.4)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '30px', height: '30px', background: 'radial-gradient(circle, rgba(52,211,153,0.4) 0%, transparent 70%)', borderRadius: '50%' }}></div>
        <span style={{ fontSize: '17px', fontWeight: '900', letterSpacing: '0.5px', color: '#ecfdf5' }}>US</span>
        <span style={{ fontSize: '8px', fontWeight: '700', color: '#6ee7b7', marginTop: '1px' }}>NASDAQ</span>
      </div>
    ), 
    title: '나스닥 100', 
    modalTitle: '나스닥 100 구성종목',
    desc: '미국 핵심 기술주 100선' 
  },
  { 
    id: 'SP500', 
    icon: (
      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #450a0a 0%, #991b1b 100%)', borderRadius: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #ef4444', boxShadow: '0 4px 12px rgba(153, 27, 27, 0.4)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '30px', height: '30px', background: 'radial-gradient(circle, rgba(248,113,113,0.4) 0%, transparent 70%)', borderRadius: '50%' }}></div>
        <span style={{ fontSize: '17px', fontWeight: '900', letterSpacing: '0.5px', color: '#fef2f2' }}>US</span>
        <span style={{ fontSize: '8px', fontWeight: '700', color: '#fca5a5', marginTop: '1px' }}>S&P 500</span>
      </div>
    ), 
    title: 'S&P 500', 
    modalTitle: 'S&P 500 구성종목',
    desc: '미국 대표 기업 500선' 
  }
];

const formatFinValue = (val, type) => {
  if (!val || val === '-') return '-';
  const num = Number(val);
  if (Number.isNaN(num)) return val;

  if (type === 'compact') {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(num);
  }
  if (type === 'percent') {
    return (num * 100).toFixed(2) + '%';
  }
  if (type === 'decimal') {
    return num.toFixed(2);
  }
  return val;
};

const formatPriceWithCurrency = (price, currency) => {
  if (price == null) return '—';
  if (currency === 'USD') return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (currency === 'KRW' || currency === 'KOR') return `${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}원`;
  return `${price.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency || ''}`;
};

const getMarketBadge = (symbol, exchange) => {
  if (symbol.endsWith('.KS') || exchange === 'KOSPI') return { text: 'KOSPI', bg: '#eff6ff', color: '#2563eb' };
  if (symbol.endsWith('.KQ') || exchange === 'KOSDAQ') return { text: 'KOSDAQ', bg: '#f5f3ff', color: '#7c3aed' };
  const ex = (exchange || '').toUpperCase();
  if (ex === 'NASDAQ' || ex === 'NMS' || ex.includes('NASDAQ')) return { text: 'NASDAQ', bg: '#ecfdf5', color: '#059669' };
  if (ex === 'NYSE' || ex === 'NYQ' || ex.includes('NYSE')) return { text: 'S&P500', bg: '#e0f2fe', color: '#0284c7' };
  return { text: exchange && exchange !== 'US' ? exchange : 'US', bg: '#f3f4f6', color: '#4b5563' };
};

function calcEMA(data, n) {
  const k = 2 / (n + 1);
  const emaArray = new Array(data.length).fill(null);
  let prevEma = null;

  for (let i = 0; i < data.length; i++) {
    const price = data[i].close;
    if (price == null) continue;

    if (prevEma === null) {
      if (i >= n - 1) {
        let sum = 0;
        let validCount = 0;
        for (let j = i - n + 1; j <= i; j++) {
          if (data[j].close != null) {
            sum += data[j].close;
            validCount++;
          }
        }
        if (validCount === n) {
          prevEma = sum / n;
          emaArray[i] = Number(prevEma.toFixed(2));
        }
      }
    } else {
      prevEma = price * k + prevEma * (1 - k);
      emaArray[i] = Number(prevEma.toFixed(2));
    }
  }
  return emaArray;
}

function calcMACD(data, shortP = 12, longP = 26, signalP = 9) {
  const shortEma = calcEMA(data, shortP);
  const longEma = calcEMA(data, longP);
  
  const macdLine = [];
  const pseudoData = [];
  for (let i = 0; i < data.length; i++) {
    if (shortEma[i] != null && longEma[i] != null) {
      const val = shortEma[i] - longEma[i];
      macdLine.push(val);
      pseudoData.push({ close: val });
    } else {
      macdLine.push(null);
      pseudoData.push({ close: null });
    }
  }
  
  const signalLine = calcEMA(pseudoData, signalP);
  
  return data.map((_, i) => {
    const m = macdLine[i];
    const s = signalLine[i];
    const h = (m != null && s != null) ? m - s : null;
    return { macd: m, signal: s, hist: h };
  });
}

function calcIchimoku(data) {
  const result = new Array(data.length).fill(null).map(() => ({ spanA: null, spanB: null }));
  const tenkan = new Array(data.length).fill(null);
  const kijun = new Array(data.length).fill(null);

  for (let i = 0; i < data.length; i++) {
    if (data[i].close == null) continue; // 데이터가 없는 미래 캔들은 계산 스킵
    
    // 전환선 (9일 고저 평균)
    let tHigh = -Infinity; let tLow = Infinity;
    for (let j = Math.max(0, i - 9 + 1); j <= i; j++) {
      if (data[j].high != null) tHigh = Math.max(tHigh, data[j].high);
      if (data[j].low != null) tLow = Math.min(tLow, data[j].low);
    }
    if (tHigh !== -Infinity) tenkan[i] = (tHigh + tLow) / 2;

    // 기준선 (26일 고저 평균)
    let kHigh = -Infinity; let kLow = Infinity;
    for (let j = Math.max(0, i - 26 + 1); j <= i; j++) {
      if (data[j].high != null) kHigh = Math.max(kHigh, data[j].high);
      if (data[j].low != null) kLow = Math.min(kLow, data[j].low);
    }
    if (kHigh !== -Infinity) kijun[i] = (kHigh + kLow) / 2;

    // 선행스팬1 (전환선+기준선 평균을 26일 앞당김)
    if (tenkan[i] != null && kijun[i] != null) {
      const spanA = (tenkan[i] + kijun[i]) / 2;
      const targetIdx = i + 25; // 26일 선행 (당일 포함이므로 +25)
      if (targetIdx < result.length) {
        result[targetIdx].spanA = Number(spanA.toFixed(2));
      }
    }

    // 선행스팬2 (52일 고저 평균을 26일 앞당김)
    let sHigh = -Infinity; let sLow = Infinity;
    for (let j = Math.max(0, i - 52 + 1); j <= i; j++) {
      if (data[j].high != null) sHigh = Math.max(sHigh, data[j].high);
      if (data[j].low != null) sLow = Math.min(sLow, data[j].low);
    }
    if (sHigh !== -Infinity) {
      const spanB = (sHigh + sLow) / 2;
      const targetIdx = i + 25;
      if (targetIdx < result.length) {
        result[targetIdx].spanB = Number(spanB.toFixed(2));
      }
    }
  }
  return result;
}

const CandlestickShape = (props) => {
  const { x, y, width, height, payload, showSignals } = props;
  if (payload.close == null) return null; // 빈 여백 데이터일 경우 캔들을 그리지 않습니다.

  const close = payload.close ?? 0;
  const open = payload.open ?? close;
  const high = payload.high ?? Math.max(open, close);
  const low = payload.low ?? Math.min(open, close);

  const isUp = close >= open;
  const color = isUp ? '#dc2626' : '#2563eb'; // 상승: 빨강, 하락: 파랑

  const range = high - low;
  // y는 고가(high)의 픽셀 좌표, y+height는 저가(low)의 픽셀 좌표입니다.
  const openY = range === 0 ? y : y + height * ((high - open) / range);
  const closeY = range === 0 ? y : y + height * ((high - close) / range);

  const bodyTop = Math.min(openY, closeY);
  const bodyBottom = Math.max(openY, closeY);
  const bodyHeight = Math.max(bodyBottom - bodyTop, 1); // 캔들 몸통 최소 높이 1px

  const centerX = x + width / 2;

  return (
    <g>
      {/* 윗수염, 아래수염 (꼬리) */}
      <line x1={centerX} y1={y} x2={centerX} y2={y + height} stroke={color} strokeWidth={1} />
      {/* 캔들 몸통 */}
      <rect x={x} y={bodyTop} width={width} height={bodyHeight} fill={color} stroke={color} strokeWidth={1} />

      {/* 매매 시그널 아이콘 */}
      {showSignals && payload.buySignal && (
        <text x={centerX} y={y + height + 18} textAnchor="middle" fontSize="14">🔥</text>
      )}
      {showSignals && payload.sellSignal && (
        <text x={centerX} y={y - 8} textAnchor="middle" fontSize="14">💀</text>
      )}
    </g>
  );
};

const MacdSignalDot = (props) => {
  const { cx, cy, payload } = props;
  if (payload.macdBuySignal) {
    // 골든크로스: 빨간색 상승 세모
    return <text x={cx} y={cy + 14} textAnchor="middle" fontSize="12">🔺</text>;
  }
  if (payload.macdSellSignal) {
    // 데드크로스: 파란색 하락 세모
    return <text x={cx} y={cy - 6} textAnchor="middle" fontSize="12">🔻</text>;
  }
  return null;
};

const CustomTooltip = ({ active, payload, label, showMA, showIchimoku }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (data.close == null && !(showIchimoku && (data.spanA != null || data.spanB != null))) return null;

    return (
      <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', padding: '10px', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: '6px', fontWeight: 700, color: '#374151' }}>{label}</div>
        {data.close != null && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', color: '#4b5563', marginBottom: '4px' }}>
              <span>시가:</span> <span>{data.open?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', color: '#dc2626', marginBottom: '4px' }}>
              <span>고가:</span> <span>{data.high?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', color: '#2563eb', marginBottom: '4px' }}>
              <span>저가:</span> <span>{data.low?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', color: '#111827', fontWeight: 600 }}>
              <span>종가:</span> <span>{data.close?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', color: '#6b7280', marginBottom: '4px', fontSize: '11px', marginTop: '4px' }}>
              <span>거래량:</span> <span>{data.volume?.toLocaleString() || '-'}</span>
            </div>
          </>
        )}
        {(showMA?.[10] || showMA?.[20] || showMA?.[50]) && data.close != null && (
          <div style={{ marginTop: '8px', borderTop: '1px solid #e5e7eb', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: 11 }}>
            <div style={{ fontWeight: 600, color: '#374151', marginBottom: '2px' }}>지수 이동평균선 (EMA)</div>
            {showMA?.[10] && data.ema10 != null && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}><span>10일선:</span> <span style={{ fontWeight: 500 }}>{data.ema10.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>}
            {showMA?.[20] && data.ema20 != null && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f97316' }}><span>20일선:</span> <span style={{ fontWeight: 500 }}>{data.ema20.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>}
            {showMA?.[50] && data.ema50 != null && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2563eb' }}><span>50일선:</span> <span style={{ fontWeight: 500 }}>{data.ema50.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>}
          </div>
        )}
        {showIchimoku && (data.spanA != null || data.spanB != null) && (
          <div style={{ marginTop: '8px', borderTop: '1px solid #e5e7eb', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: 11 }}>
            <div style={{ fontWeight: 600, color: '#374151', marginBottom: '2px' }}>일목균형표 (구름대)</div>
            {data.spanA != null && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}><span>선행스팬1:</span> <span style={{ fontWeight: 500 }}>{data.spanA.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>}
            {data.spanB != null && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#3b82f6' }}><span>선행스팬2:</span> <span style={{ fontWeight: 500 }}>{data.spanB.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>}
          </div>
        )}
        {(data.macd != null) && data.close != null && (
          <div style={{ marginTop: '8px', borderTop: '1px solid #e5e7eb', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: 11 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#374151', fontWeight: 600, marginBottom: '2px' }}><span>MACD (12, 26, 9)</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2563eb' }}><span>MACD:</span> <span style={{ fontWeight: 500 }}>{data.macd.toFixed(2)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f97316' }}><span>Signal:</span> <span style={{ fontWeight: 500 }}>{data.macdSignal.toFixed(2)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: data.macdHist >= 0 ? '#dc2626' : '#2563eb' }}><span>Histogram:</span> <span style={{ fontWeight: 500 }}>{data.macdHist.toFixed(2)}</span></div>
          </div>
        )}
      </div>
    );
  }
  return null;
};

function MaGuide({ data }) {
  const [isOpen, setIsOpen] = useState(false);
  const validData = useMemo(() => data ? data.filter(d => d.close != null) : [], [data]);
  if (!validData || validData.length < 5) return null;
  const ema10 = calcEMA(validData, Math.min(10, validData.length));
  const ema20 = calcEMA(validData, Math.min(20, validData.length));
  const ema50 = calcEMA(validData, Math.min(50, validData.length));
  const macdArr = calcMACD(validData, 12, 26, 9);
  const last = validData.length - 1;
  const price = validData[last].close;
  const prev = validData[last - 1]?.close ?? price;
  const vol = validData[last].volume ?? 0;
  const prevVol = validData[last - 1]?.volume ?? 0;
  
  const currentEma10 = ema10[last] ?? 0;
  const currentEma20 = ema20[last] ?? 0;
  const currentEma50 = ema50[last] ?? 0;
  const prevEma20 = ema20[last - 1] ?? currentEma20;

  const isUptrend = price > currentEma10 && currentEma10 > currentEma20 && currentEma20 > currentEma50;
  const isDowntrend = price < currentEma50 && currentEma20 < currentEma50;

  // 매수, 매도 시그널 계산
  const pct = prev > 0 ? ((price - prev) / prev) * 100 : 0;
  const isBullish = pct >= 3.0 && price > currentEma10 && price > currentEma20;
  const isVolSurge = prevVol > 0 && vol > prevVol * 1.5;
  const buySignal = isBullish && isVolSurge;
  const sellSignal = price < currentEma20 && prev >= prevEma20;

  // MACD 시그널 계산
  const currentMacd = macdArr[last]?.macd;
  const currentSignal = macdArr[last]?.signal;
  const prevMacd = macdArr[last - 1]?.macd;
  const prevSignal = macdArr[last - 1]?.signal;

  let macdBuySignal = false;
  let macdSellSignal = false;
  if (prevMacd != null && prevSignal != null && currentMacd != null && currentSignal != null) {
    if (prevMacd <= prevSignal && currentMacd > currentSignal) macdBuySignal = true;
    if (prevMacd >= prevSignal && currentMacd < currentSignal) macdSellSignal = true;
  }

  const rows = [
    {
      label: '종목 선정 기준',
      badge: isUptrend
        ? { t: '정배열 주도주 충족', c: '#dc2626', b: '#fef2f2' }
        : isDowntrend
        ? { t: '시세 이탈 (제외)', c: '#2563eb', b: '#eff6ff' }
        : { t: '횡보/조정 구간', c: '#d97706', b: '#fffbeb' },
      desc: isUptrend 
        ? '10, 20, 50 EMA 정배열 상태입니다. 지속 상승 중이거나 횡보 돌파 시 타점을 노려볼 수 있습니다.'
        : isDowntrend
        ? '장기 이평선(50일)을 이탈하여 하락 중입니다. 주도주 매매 대상에서 제외하세요.'
        : '현재 정배열이 풀렸거나 박스권 횡보 중입니다. 거래량이 마르면서 에너지를 응축하는지 확인하세요.'
    },
    {
      label: '돌파 매수 타점',
      badge: buySignal
        ? { t: '🔥 강력한 돌파 포착', c: '#dc2626', b: '#fef2f2' }
        : isUptrend
        ? { t: '돌파 대기 (관망)', c: '#d97706', b: '#fffbeb' }
        : { t: '조건 미달', c: '#9ca3af', b: '#f3f4f6' },
      desc: buySignal
        ? '거래량이 1.5배 이상 급증하며 장대양봉이 발생했습니다! 매수 진입을 고려해 볼 수 있는 완벽한 급소입니다.'
        : isUptrend
        ? '상승 추세 내 횡보/조정 중입니다. 거래량이 크게 터지며 하향 추세선을 상향 돌파하는 장대양봉을 기다리세요.'
        : '아직 뚜렷한 상승 돌파 에너지가 보이지 않습니다. 매수를 보류하고 관망하세요.'
    },
    {
      label: '익절 및 손절 (Exit)',
      badge: sellSignal
        ? { t: '💀 20일선 이탈 (매도)', c: '#2563eb', b: '#eff6ff' }
        : price > currentEma20
        ? { t: '20일선 지지 (보유)', c: '#dc2626', b: '#fef2f2' }
        : { t: '20일선 하회 (주의)', c: '#2563eb', b: '#eff6ff' },
      desc: sellSignal
        ? '종가 기준으로 트레일링 스탑 기준인 20일 지수선(EMA)을 하향 돌파했습니다. 전량 매도를 고려하세요.'
        : price > currentEma20
        ? '주가가 20일선 위에서 순항 중입니다. 이탈 전까지 절대 팔지 말고 수익을 길게 끌고 가세요. (진입 직후라면 양봉 저점 -5% 손절 유지)'
        : '주가가 20일선 아래에 위치해 리스크가 큽니다. 신규 진입을 금지하고, 보유 중이라면 손절 원칙을 점검하세요.'
    },
    {
      label: 'MACD 지표 활용',
      badge: macdBuySignal
        ? { t: '🔺 골든크로스 발생', c: '#dc2626', b: '#fef2f2' }
        : macdSellSignal
        ? { t: '🔻 데드크로스 발생', c: '#2563eb', b: '#eff6ff' }
        : (currentMacd != null && currentSignal != null && currentMacd > currentSignal)
        ? { t: '상승 모멘텀 유지', c: '#dc2626', b: '#fef2f2' }
        : { t: '하락/조정 모멘텀', c: '#2563eb', b: '#eff6ff' },
      desc: macdBuySignal
        ? 'MACD선이 시그널선을 상향 돌파했습니다. 주가 반등 및 새로운 상승 파동의 강력한 전조 신호입니다.'
        : macdSellSignal
        ? 'MACD선이 시그널선을 하향 돌파했습니다. 상승 에너지가 약해지고 하락 압력이 커지는 시점이므로 주의하세요.'
        : (currentMacd != null && currentSignal != null && currentMacd > currentSignal)
        ? 'MACD가 시그널선 위에 머물러 있어 단기적인 상승 에너지가 양호한 상태입니다.'
        : 'MACD가 시그널선 아래에 머물러 있습니다. 바닥을 다지고 골든크로스가 발생할 때까지 기다리세요.'
    }
  ];

  return (
    <div style={{ marginTop: 24, borderTop: '1px solid #e5e7eb', paddingTop: 20 }}>
      <div
        className="section-title"
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>📈 지수이평선(EMA) 매매 전략</span>
        <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 'normal' }}>{isOpen ? '▲ 접기' : '▼ 펼치기'}</span>
      </div>
      {isOpen && rows.map((r) => (
        <div
          key={r.label}
          className="guide-card"
          style={{ borderLeftColor: r.badge.c }}
        >
          <div className="guide-header">
            <span className="guide-title">{r.label}</span>
            <span
              className="guide-badge"
              style={{ color: r.badge.c, backgroundColor: r.badge.b }}
            >
              {r.badge.t}
            </span>
          </div>
            <div
              className="guide-desc"
              title={r.desc}
              style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}
            >
              {r.desc}
            </div>
        </div>
      ))}
    </div>
  );
}

function App() {
  const [watchlist, setWatchlist] = useState(() => {
    const saved = localStorage.getItem('stockDashboardWatchlist');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse watchlist from localStorage', e);
      }
    }
    return DEFAULT_SYMBOLS;
  });
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('stockDashboardFavorites');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse favorites from localStorage', e);
      }
    }
    return [];
  });
  const [quoteCache, setQuoteCache] = useState({});
  const [selected, setSelected] = useState(null);
  const [sectorFilter, setSectorFilter] = useState('전체');
  const [tabIdx, setTabIdx] = useState(0);
  const [chartCache, setChartCache] = useState({});
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [visibleRange, setVisibleRange] = useState(null);
  const chartContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showMA, setShowMA] = useState({ 10: true, 20: true, 50: true });
  const [showIchimoku, setShowIchimoku] = useState(false);
  const [showSignals, setShowSignals] = useState(true);
  const [showFinancials, setShowFinancials] = useState(false);
  const [showInvestmentTrend, setShowInvestmentTrend] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [indicatorMenuOpen, setIndicatorMenuOpen] = useState(false);
  const startXRef = useRef(0);
  
  const [investorTrendData, setInvestorTrendData] = useState([]);
  const [investorTrendLoading, setInvestorTrendLoading] = useState(false);

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiMode, setAiMode] = useState(1);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const [marketExplorerOpen, setMarketExplorerOpen] = useState(false);
  const [marketExplorerType, setMarketExplorerType] = useState('');
  const [marketExplorerData, setMarketExplorerData] = useState([]);
  const [marketExplorerLoading, setMarketExplorerLoading] = useState(false);
  const [marketExplorerSearch, setMarketExplorerSearch] = useState('');
  
  const [aiRecommendModalOpen, setAiRecommendModalOpen] = useState(false);
  const [aiRecommendMarket, setAiRecommendMarket] = useState('NASDAQ');
  const [aiRecommendResult, setAiRecommendResult] = useState('');
  const [aiRecommendLoading, setAiRecommendLoading] = useState(false);

  const sectorCounts = useMemo(() => {
    const counts = { '전체': watchlist.length, '❤️ 관심종목': favorites.filter(f => watchlist.includes(f)).length };
    watchlist.forEach((sym) => {
      const q = quoteCache[sym];
      const sector = q ? (q.sector || '섹터 미상') : '데이터 로딩중';
      counts[sector] = (counts[sector] || 0) + 1;
    });
    return counts;
  }, [watchlist, quoteCache, favorites]);

  const sectors = Object.keys(sectorCounts).sort((a, b) => {
    if (a === '전체') return -1;
    if (b === '전체') return 1;
    if (a === '❤️ 관심종목') return -1;
    if (b === '❤️ 관심종목') return 1;
    if (a === '데이터 로딩중') return 1;
    if (b === '데이터 로딩중') return -1;
    return a.localeCompare(b);
  });

  useEffect(() => {
    localStorage.setItem('stockDashboardWatchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    localStorage.setItem('stockDashboardFavorites', JSON.stringify(favorites));
  }, [favorites]);

  // 종목이나 차트 탭이 변경되면 확대/축소 상태를 초기화합니다.
  useEffect(() => {
    setVisibleRange(null);
  }, [selected, tabIdx]);

  const refreshQuotes = useCallback(async () => {
    try {
      const symbols = watchlist;
      if (!symbols.length) return;
      
      // 야후 파이낸스 차단(Rate Limit)을 방지하기 위해 하나씩 순차적으로 요청합니다.
      for (const s of symbols) {
        try {
          const res = await axios.get(`${API_BASE_URL}/api/quote/${encodeURIComponent(s)}`);
          if (res?.data) {
            setQuoteCache((prev) => ({ ...prev, [s]: res.data }));
          }
        } catch (e) {
          console.error(`Failed to fetch ${s}:`, e);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [watchlist]);

  useEffect(() => {
    refreshQuotes();
  }, [refreshQuotes]);

  const loadChart = useCallback(
    async (symbol, idx) => {
      const key = `${symbol}-${idx}`;
      if (chartCache[key]) return;
      const tab = CHART_TABS[idx];
      setChartLoading(true);
      setChartError('');
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/chart/${encodeURIComponent(symbol)}?interval=${tab.interval}`
        );
        const raw = res.data?.data || [];
        let mapped = raw.map((d) => ({
          ...d,
          label: ['15m', '30m', '60m'].includes(tab.interval)
            ? d.date?.slice(5, 16).replace('-', '/')
            : d.date?.slice(5).replace('-', '/')
        }));

        // 차트 오른쪽에 미래 날짜 여백(26칸)을 먼저 추가하여 선행스팬이 표시될 수 있게 합니다.
        if (mapped.length > 0) {
          const lastDateStr = raw[raw.length - 1].date;
          const parsedDateStr = ['15m', '30m', '60m'].includes(tab.interval) ? lastDateStr.replace(' ', 'T') + ':00' : lastDateStr + 'T00:00:00';
          const lastDate = new Date(parsedDateStr);
          for (let i = 0; i < 26; i++) {
            if (tab.interval === '1d') {
              lastDate.setDate(lastDate.getDate() + 1);
              while (lastDate.getDay() === 0 || lastDate.getDay() === 6) {
                lastDate.setDate(lastDate.getDate() + 1); // 주말 건너뛰기
              }
            } else if (tab.interval === '1wk') {
              lastDate.setDate(lastDate.getDate() + 7);
            } else if (tab.interval === '1mo') {
              lastDate.setMonth(lastDate.getMonth() + 1);
            } else if (['15m', '30m', '60m'].includes(tab.interval)) {
              if (tab.interval === '15m') lastDate.setMinutes(lastDate.getMinutes() + 15);
              else if (tab.interval === '30m') lastDate.setMinutes(lastDate.getMinutes() + 30);
              else if (tab.interval === '60m') lastDate.setHours(lastDate.getHours() + 1);
              
              while (lastDate.getDay() === 0 || lastDate.getDay() === 6) {
                lastDate.setDate(lastDate.getDate() + 1);
              }
            }
            const mStr = String(lastDate.getMonth() + 1).padStart(2, '0');
            const dStr = String(lastDate.getDate()).padStart(2, '0');
            let labelStr = `${mStr}/${dStr}`;
            if (['15m', '30m', '60m'].includes(tab.interval)) {
              const hStr = String(lastDate.getHours()).padStart(2, '0');
              const minStr = String(lastDate.getMinutes()).padStart(2, '0');
              labelStr = `${mStr}/${dStr} ${hStr}:${minStr}`;
            }
            mapped.push({
              label: labelStr,
              close: null, open: null, high: null, low: null, volume: null
            });
          }
        }

        const ema10Arr = calcEMA(mapped, 10);
        const ema20Arr = calcEMA(mapped, 20);
        const ema50Arr = calcEMA(mapped, 50);
        const macdArr = calcMACD(mapped, 12, 26, 9);
        const ichimokuArr = calcIchimoku(mapped);

        mapped = mapped.map((d, i) => {
          const currentEma10 = ema10Arr[i];
          const currentEma20 = ema20Arr[i];
          const currentEma50 = ema50Arr[i];
          
          const price = d.close ?? 0;
          const prev = i > 0 ? (mapped[i - 1].close ?? price) : price;
          const vol = d.volume ?? 0;
          const prevVol = i > 0 ? (mapped[i - 1].volume ?? 0) : 0;
          
          let buySignal = false;
          let sellSignal = false;
          
          let macdBuySignal = false;
          let macdSellSignal = false;

          // MACD 골든크로스 / 데드크로스 신호 계산
          if (i > 0) {
            const prevMacd = macdArr[i - 1].macd;
            const prevSignal = macdArr[i - 1].signal;
            const currentMacd = macdArr[i].macd;
            const currentSignal = macdArr[i].signal;

            if (prevMacd != null && prevSignal != null && currentMacd != null && currentSignal != null) {
              if (prevMacd <= prevSignal && currentMacd > currentSignal) {
                macdBuySignal = true; // 골든크로스
              }
              if (prevMacd >= prevSignal && currentMacd < currentSignal) {
                macdSellSignal = true; // 데드크로스
              }
            }
          }

          // 쿨라매기 돌파 타점 시그널 로직 (근사치)
          if (currentEma10 != null && currentEma20 != null) {
            const pct = prev > 0 ? ((price - prev) / prev) * 100 : 0;
            
            // 매수: 3% 이상 강한 장대양봉 + 10&20 EMA 위로 마감 + 전일 대비 거래량 1.5배 이상 급증
            const isBullish = pct >= 3.0 && price > currentEma10 && price > currentEma20;
            const isVolSurge = prevVol > 0 && vol > prevVol * 1.5;
            
            if (isBullish && isVolSurge) buySignal = true;
            
            // 매도: 트레일링 스탑 기준인 20일 지수선(EMA) 종가 기준 완벽 이탈 (데드크로스)
            const prevPrice = prev;
            const crossDown20 = price < currentEma20 && prevPrice >= (ema20Arr[i - 1] ?? currentEma20);
            
            if (crossDown20) sellSignal = true;
          }
          
          const spanA = ichimokuArr[i].spanA;
          const spanB = ichimokuArr[i].spanB;
          let bullCloud = null;
          let bearCloud = null;
          if (spanA != null && spanB != null) {
            if (spanA >= spanB) {
              bullCloud = [spanB, spanA];
            } else {
              bearCloud = [spanA, spanB];
            }
          }

          return {
            ...d,
            ema10: currentEma10,
            ema20: currentEma20,
            ema50: currentEma50,
            macd: macdArr[i].macd,
            macdSignal: macdArr[i].signal,
            macdHist: macdArr[i].hist,
            macdBuySignal,
            macdSellSignal,
            buySignal,
            sellSignal,
            spanA,
            spanB,
            bullCloud,
            bearCloud
          };
        });

        setChartCache((prev) => ({ ...prev, [key]: mapped }));
      } catch (e) {
        console.error(e);
        setChartError('차트 로드 실패. 잠시 후 다시 시도해 주세요.');
      } finally {
        setChartLoading(false);
      }
    },
    [chartCache]
  );

  const loadInvestorTrend = async (sym) => {
    setInvestorTrendLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/investor-trend/${encodeURIComponent(sym)}`);
      setInvestorTrendData(res.data);
    } catch (e) {
      console.error(e);
      setInvestorTrendData([]);
    } finally {
      setInvestorTrendLoading(false);
    }
  };

  const handleSelect = (sym) => {
    const next = sym === selected ? null : sym;
    setSelected(next);
    if (next) {
      loadChart(next, tabIdx);
      loadInvestorTrend(next);
    }
  };

  const handleTab = (idx) => {
    setTabIdx(idx);
    if (selected) loadChart(selected, idx);
  };

  const handleRemove = (sym, e) => {
    e.stopPropagation();
    setWatchlist((prev) => prev.filter((s) => s !== sym));
    if (selected === sym) setSelected(null);
  };

  const toggleFavorite = (sym, e) => {
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  const filtered = watchlist.filter((s) => {
    if (sectorFilter === '전체') return true;
    if (sectorFilter === '❤️ 관심종목') return favorites.includes(s);
    const q = quoteCache[s];
    const sector = q ? (q.sector || '섹터 미상') : '데이터 로딩중';
    return sector === sectorFilter;
  });

  const krFiltered = filtered.filter(sym => sym.endsWith('.KS') || sym.endsWith('.KQ'));
  const usFiltered = filtered.filter(sym => !(sym.endsWith('.KS') || sym.endsWith('.KQ')));

  const renderStockCard = (sym) => {
    const q = quoteCache[sym];
    const isSelected = sym === selected;
    const change = q?.changePct ?? 0;
    const up = change >= 0;

    return (
      <div
        key={sym}
        className={`stock-card ${isSelected ? 'selected' : ''}`}
        onClick={() => handleSelect(sym)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div
              onClick={(e) => toggleFavorite(sym, e)}
              style={{ cursor: 'pointer', fontSize: '16px', filter: favorites.includes(sym) ? 'none' : 'grayscale(100%) opacity(0.2)', transition: 'filter 0.2s' }}
              title={favorites.includes(sym) ? '관심종목 해제' : '관심종목 추가'}
            >
              ❤️
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
              <div title={q?.name || sym} style={{ fontSize: 15, fontWeight: 700, color: '#111827', wordBreak: 'keep-all', lineHeight: '1.2' }}>
                {q?.name || sym} <span style={{ fontSize: 13, fontWeight: 500, color: '#6b7280' }}>({sym.replace(/\.(KS|KQ)$/i, '')})</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                {getMarketBadge(sym, q?.exchange).text} {q?.sector && `· ${q.sector}`}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>{formatPriceWithCurrency(q?.price, q?.currency)}</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: up ? '#dc2626' : '#2563eb' }}>{q?.changePct != null ? `${up ? '▲' : '▼'} ${Math.abs(q.changePct).toFixed(2)}%` : '—'}</div>
            </div>
            <button className="stock-card-close-btn" type="button" onClick={(e) => handleRemove(sym, e)} style={{ marginLeft: '4px' }}>×</button>
          </div>
        </div>
      </div>
    );
  };

  const selectedQuote = selected ? quoteCache[selected] : null;
  const chartKey = selected ? `${selected}-${tabIdx}` : '';
  const chartData = chartCache[chartKey] || [];
  const isUp = selectedQuote ? (selectedQuote.changePct ?? 0) >= 0 : true;

  // 차트 기본 보임 범위: 최근 90개(약 3~4개월) 데이터만 먼저 보여줍니다.
  const defaultStartIndex = Math.max(0, chartData.length - 90);
  const currentStartIndex = visibleRange ? visibleRange.startIndex : defaultStartIndex;
  const currentEndIndex = visibleRange ? visibleRange.endIndex : chartData.length - 1;
  const visibleData = chartData.slice(currentStartIndex, currentEndIndex + 1);

  const validVisibleData = visibleData.filter((d) => d.close != null || (showIchimoku && (d.spanA != null || d.spanB != null)));
  const chartMin = validVisibleData.length
    ? Math.min(...validVisibleData.map((d) => Math.min(
        d.low ?? d.close ?? Infinity,
        showMA[10] ? (d.ema10 ?? Infinity) : Infinity,
        showMA[20] ? (d.ema20 ?? Infinity) : Infinity,
        showMA[50] ? (d.ema50 ?? Infinity) : Infinity,
        showIchimoku ? (d.spanA ?? Infinity) : Infinity,
        showIchimoku ? (d.spanB ?? Infinity) : Infinity
      ))) * 0.995
    : 0;
  const chartMax = validVisibleData.length
    ? Math.max(...validVisibleData.map((d) => Math.max(
        d.high ?? d.close ?? -Infinity,
        showMA[10] ? (d.ema10 ?? -Infinity) : -Infinity,
        showMA[20] ? (d.ema20 ?? -Infinity) : -Infinity,
        showMA[50] ? (d.ema50 ?? -Infinity) : -Infinity,
        showIchimoku ? (d.spanA ?? -Infinity) : -Infinity,
        showIchimoku ? (d.spanB ?? -Infinity) : -Infinity
      ))) * 1.04
    : 0;
  const maxVolume = validVisibleData.length
    ? Math.max(...validVisibleData.map((d) => d.volume || 0))
    : 0;

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const handleNativeWheel = (e) => {
      if (!chartData || chartData.length === 0) return;
      
      // 브라우저 화면 전체가 스크롤되는 것을 완벽하게 방지합니다.
      e.preventDefault();

      // 마우스 커서 위치 비율 계산 (Y축 너비 등 여백을 제외한 순수 데이터 영역 기준)
      const rect = container.getBoundingClientRect();
      const paddingLeft = 60; // YAxis 기본 width
      const paddingRight = 10;
      const dataWidth = Math.max(1, rect.width - paddingLeft - paddingRight);
      const mouseX = e.clientX - rect.left - paddingLeft;
      const mouseRatio = Math.max(0, Math.min(1, mouseX / dataWidth));

      setVisibleRange((prev) => {
        const currentStartIndex = prev ? prev.startIndex : defaultStartIndex;
        const currentEndIndex = prev ? prev.endIndex : chartData.length - 1;
        const currentRange = currentEndIndex - currentStartIndex;

        const zoomFactor = 0.1;
        // 한 번 휠을 굴릴 때 총 변동량
        const totalZoomAmount = Math.max(2, Math.ceil(currentRange * zoomFactor * 2));

        let newStartIndex, newEndIndex;
        if (e.deltaY < 0) { // 확대 (마우스 위치 기준)
          newStartIndex = currentStartIndex + Math.round(totalZoomAmount * mouseRatio);
          newEndIndex = currentEndIndex - Math.round(totalZoomAmount * (1 - mouseRatio));
        } else { // 축소 (마우스 위치 기준)
          newStartIndex = currentStartIndex - Math.round(totalZoomAmount * mouseRatio);
          newEndIndex = currentEndIndex + Math.round(totalZoomAmount * (1 - mouseRatio));
        }

        newStartIndex = Math.max(0, newStartIndex);
        newEndIndex = Math.min(chartData.length - 1, newEndIndex);

        if (newEndIndex - newStartIndex < 10) return prev;

        return { startIndex: newStartIndex, endIndex: newEndIndex };
      });
    };

    // passive: false 옵션을 통해 e.preventDefault()가 정상 작동하도록 강제합니다.
    container.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleNativeWheel);
    };
  }, [chartData, defaultStartIndex]);

  const handleAiAnalysis = async (mode) => {
    if (!selected) return;
    setAiMode(mode);
    setAiLoading(true);
    setAiResult('');
    try {
      const res = await axios.get(`${API_BASE_URL}/api/ai-analysis/${encodeURIComponent(selected)}?mode=${mode}`);
      setAiResult(res.data.result);
    } catch (e) {
      console.error(e);
      const errorMsg = e.response?.data?.detail || e.message || '알 수 없는 오류';
      setAiResult(`⚠️ AI 분석 중 오류가 발생했습니다.\n\n[상세 내용]\n${errorMsg}\n\n백엔드 서버를 다시 시작하거나 라이브러리가 잘 설치되었는지 확인해주세요.`);
    } finally {
      setAiLoading(false);
    }
  };

  const doSearch = useCallback(
    async (q) => {
      if (!q.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        setSearchLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/search/${encodeURIComponent(q.trim())}`);
        setSearchResults(res.data?.results || []);
      } catch (e) {
        console.error(e);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    },
    []
  );

  const handleAddFromSearch = (symbol) => {
    if (!symbol) return;
    if (!watchlist.includes(symbol)) {
      setWatchlist((prev) => [...prev, symbol]);
    }
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const openMarketExplorer = async (type) => {
    setMarketExplorerOpen(true);
    setMarketExplorerType(type);
    setMarketExplorerLoading(true);
    setMarketExplorerData([]);
    setMarketExplorerSearch('');
    
    try {
      if (type === 'KOSPI' || type === 'KOSDAQ') {
        const res = await axios.get(`${API_BASE_URL}/api/top-kr-stocks`);
        if (type === 'KOSPI') setMarketExplorerData(res.data.filter(d => d.symbol.endsWith('.KS')));
        if (type === 'KOSDAQ') setMarketExplorerData(res.data.filter(d => d.symbol.endsWith('.KQ')));
      } else if (type === 'NASDAQ') {
        const res = await axios.get(`${API_BASE_URL}/api/top-us-ndx`);
        setMarketExplorerData(res.data);
      } else if (type === 'SP500') {
        const res = await axios.get(`${API_BASE_URL}/api/top-us-stocks`);
        setMarketExplorerData(res.data);
      }
    } catch (e) {
      console.error(e);
      alert('목록을 불러오는데 실패했습니다.');
    } finally {
      setMarketExplorerLoading(false);
    }
  };

  const handleAiRecommend = async (market) => {
    setAiRecommendMarket(market);
    setAiRecommendLoading(true);
    setAiRecommendResult('');
    try {
      const res = await axios.get(`${API_BASE_URL}/api/ai-recommend?market=${market}`);
      setAiRecommendResult(res.data.result);
    } catch (e) {
      console.error(e);
      const errorMsg = e.response?.data?.detail || e.message || '알 수 없는 오류';
      setAiRecommendResult(`⚠️ AI 추천 분석 중 오류가 발생했습니다.\n\n[상세 내용]\n${errorMsg}\n\n백엔드 서버를 다시 시작하거나 잠시 후 다시 시도해주세요.`);
    } finally {
      setAiRecommendLoading(false);
    }
  };

  const parseNumber = (str) => {
    if (typeof str !== 'string') return NaN;
    return Number(str.replace(/[%,$]/g, ''));
  };

  const buildEvalBadge = (value, config) => {
    const v = parseNumber(value);
    if (Number.isNaN(v)) return null;
    return config(v);
  };

  const fin = selectedQuote?.financials || {};

  const epsBadge = buildEvalBadge(fin.eps, (v) =>
    v >= 5
      ? { t: '높음·양호', c: '#dc2626', b: '#fef2f2' }
      : v >= 2
      ? { t: '적절', c: '#d97706', b: '#fffbeb' }
      : { t: '낮음·주의', c: '#2563eb', b: '#eff6ff' }
  );
  const perBadge = buildEvalBadge(fin.per, (v) =>
    v <= 15
      ? { t: '저평가 가능', c: '#dc2626', b: '#fef2f2' }
      : v <= 25
      ? { t: '적절', c: '#d97706', b: '#fffbeb' }
      : { t: '고평가 주의', c: '#2563eb', b: '#eff6ff' }
  );
  const pbrBadge = buildEvalBadge(fin.pbr, (v) =>
    v <= 1
      ? { t: '저평가 가능', c: '#dc2626', b: '#fef2f2' }
      : v <= 3
      ? { t: '적절', c: '#d97706', b: '#fffbeb' }
      : { t: '고평가 주의', c: '#2563eb', b: '#eff6ff' }
  );
  const roeBadge = buildEvalBadge(fin.roe, (v) =>
    v >= 15
      ? { t: '높음·우량', c: '#dc2626', b: '#fef2f2' }
      : v >= 8
      ? { t: '적절', c: '#d97706', b: '#fffbeb' }
      : { t: '낮음·주의', c: '#2563eb', b: '#eff6ff' }
  );

  const filteredMarketExplorerData = useMemo(() => {
    if (!marketExplorerSearch.trim()) return marketExplorerData;
    const q = marketExplorerSearch.toLowerCase();
    return marketExplorerData.filter(item => 
      item.name.toLowerCase().includes(q) || 
      item.symbol.toLowerCase().includes(q)
    );
  }, [marketExplorerData, marketExplorerSearch]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1 className="app-title">📊 국내&해외 종목 차트 분석 및 AI 분석 대시보드</h1>
          <p className="app-subtitle">
            AI 기반으로 종목을 한 눈에 관리하고 분석합니다.
          </p>
        </div>
        <div className="app-header-right">
          <button
            className="secondary-button"
            type="button"
            style={{ borderColor: '#8b5cf6', color: '#8b5cf6', backgroundColor: '#f5f3ff', fontWeight: 600 }}
            onClick={() => setAiRecommendModalOpen(true)}
          >
            ✨ AI 종목 추천
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() => setSearchOpen(true)}
          >
            + 종목 추가
          </button>
        </div>
      </header>

      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {MARKET_EXPLORER_CARDS.map(m => (
            <button key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', cursor: 'pointer', textAlign: 'left', transition: 'transform 0.2s, box-shadow 0.2s' }} onClick={() => openMarketExplorer(m.id)} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)'; }}>
              <div style={{ width: '56px', height: '56px', flexShrink: 0 }}>{m.icon}</div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#1f2937', marginBottom: '4px' }}>{m.title}</div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>{m.desc}</div>
              </div>
            </button>
          ))}
        </div>
        
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {sectors.map((s) => (
            <button
              key={s}
              className={`chip ${sectorFilter === s ? 'active' : ''}`}
              type="button"
              onClick={() => setSectorFilter(s)}
            >
              {s} ({sectorCounts[s]})
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ flex: '0 0 320px', maxWidth: '320px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {krFiltered.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '10px 14px', backgroundColor: '#f8fafc', borderLeft: '4px solid #3b82f6', borderRadius: '6px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>🇰🇷</span> 국내 관심종목
                  </h3>
                  <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '700', backgroundColor: '#eff6ff', padding: '4px 10px', borderRadius: '12px' }}>{krFiltered.length}개</span>
                </div>
                <div className="watchlist-grid" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {krFiltered.map(renderStockCard)}
                </div>
              </div>
            )}
            
            {usFiltered.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '10px 14px', backgroundColor: '#f8fafc', borderLeft: '4px solid #ef4444', borderRadius: '6px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>🇺🇸</span> 해외 관심종목
                  </h3>
                  <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: '700', backgroundColor: '#fef2f2', padding: '4px 10px', borderRadius: '12px' }}>{usFiltered.length}개</span>
                </div>
                <div className="watchlist-grid" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {usFiltered.map(renderStockCard)}
                </div>
              </div>
            )}

            {krFiltered.length === 0 && usFiltered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '14px' }}>
                표시할 종목이 없습니다.
              </div>
            )}
          </div>
        </div>

        {selectedQuote && (
          <div className="detail-panel" style={{ flex: '1 1 0%', minWidth: 0 }}>
            <div 
              className="detail-header" 
              style={{ cursor: 'pointer' }}
              onClick={() => setShowFinancials(!showFinancials)}
              title="클릭하여 재무제표 및 지표 가이드 보기"
            >
              <div style={{ minWidth: 0, flex: 1, paddingRight: 16 }}>
                <h2
                  className="detail-title"
                  style={{ fontSize: 18, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }} title={selectedQuote.name}>
                    {selectedQuote.name}
                  </span>
                  {(() => {
                    const badge = getMarketBadge(selected, selectedQuote?.exchange);
                    return (
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 6px', borderRadius: '4px', backgroundColor: badge.bg, color: badge.color, whiteSpace: 'nowrap' }}>
                        {badge.text}
                      </span>
                    );
                  })()}
                  <span style={{ fontSize: 12, color: '#2563eb', fontWeight: 'normal', backgroundColor: '#eff6ff', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                    {showFinancials ? '▲ 재무정보 닫기' : '▼ 재무정보 보기 '}
                  </span>
                </h2>
                <div className="detail-subtitle" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 4 }}>
                {selected.replace(/\.(KS|KQ)$/i, '')} · {selectedQuote.sector}
                </div>
              </div>
              <button
                type="button"
                className="detail-close-btn"
                onClick={(e) => { e.stopPropagation(); setSelected(null); }}
              >
                ×
              </button>
            </div>

            {showFinancials && (
              <div style={{ backgroundColor: '#f8fafc', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 20, boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)' }}>
                {selectedQuote.businessSummary && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontWeight: 700, color: '#1f2937', marginBottom: 12, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🏢</span> 기업 개요
                    </div>
                    <div style={{ fontSize: 13, color: '#4b5563', backgroundColor: '#ffffff', padding: '14px 16px', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={selectedQuote.businessSummary}>
                      {selectedQuote.businessSummary}
                    </div>
                  </div>
                )}

                <div style={{ fontWeight: 700, color: '#1f2937', marginBottom: 16, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>📊</span> 핵심 재무 지표
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 12, marginBottom: 24 }}>
                  {[
                    { label: '매출', value: formatFinValue(fin.revenue, 'compact') },
                    { label: '영업이익률', value: formatFinValue(fin.operatingIncome, 'percent') },
                    { label: 'EPS', value: formatFinValue(fin.eps, 'decimal') },
                    { label: 'PER', value: formatFinValue(fin.per, 'decimal') },
                    { label: 'PBR', value: formatFinValue(fin.pbr, 'decimal') },
                    { label: 'ROE', value: formatFinValue(fin.roe, 'percent') }
                  ].map((item) => (
                    <div key={item.label} style={{ backgroundColor: '#ffffff', padding: '16px 12px', borderRadius: 10, border: '1px solid #e5e7eb', textAlign: 'center', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
                      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8, fontWeight: 500 }}>{item.label}</div>
                      <div style={{ fontSize: 17, color: '#111827', fontWeight: 700 }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ fontWeight: 700, color: '#1f2937', marginBottom: 16, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>📖</span> 지표 해석 가이드
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  {[
                    { title: 'EPS', badge: epsBadge, desc: '주당 순이익. 높을수록 주주에게 많은 이익을 창출합니다.' },
                    { title: 'PER', badge: perBadge, desc: '주가수익비율. 낮을수록 이익 대비 주가가 저렴합니다.' },
                    { title: 'PBR', badge: pbrBadge, desc: '주가순자산비율. 1 미만이면 장부가치보다 주가가 낮습니다.' },
                    { title: 'ROE', badge: roeBadge, desc: '자기자본이익률. 15% 이상이면 자본을 효율적으로 활용합니다.' }
                  ].map((guide) => (
                    <div key={guide.title} style={{ backgroundColor: '#ffffff', padding: 16, borderRadius: 10, borderLeft: `4px solid ${guide.badge?.c || '#d1d5db'}`, borderTop: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontWeight: 700, color: '#374151', fontSize: 14 }}>{guide.title}</span>
                        {guide.badge && <span style={{ fontSize: 12, color: guide.badge.c, backgroundColor: guide.badge.b, padding: '4px 10px', borderRadius: 12, fontWeight: 600 }}>{guide.badge.t}</span>}
                      </div>
                      <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, wordBreak: 'keep-all' }}>{guide.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: '#111827'
                  }}
                >
                  {formatPriceWithCurrency(selectedQuote.price, selectedQuote.currency)}
                </span>
              {selectedQuote.priceKrw != null && selectedQuote.currency !== 'KRW' && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#6b7280'
                  }}
                >
                  ({Math.round(selectedQuote.priceKrw).toLocaleString()}원)
                </span>
              )}
                {selectedQuote.changePct != null && (
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      color: isUp ? '#dc2626' : '#2563eb'
                    }}
                  >
                    {isUp ? '▲' : '▼'} {Math.abs(selectedQuote.changePct).toFixed(2)}%
                  </span>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>52주 신고가</div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#f59e0b'
                  }}
                >
                  {selectedQuote.high52w != null
                    ? selectedQuote.high52w.toLocaleString()
                    : '—'}
                </div>
              </div>
              <div style={{ textAlign: 'right', marginLeft: 16 }}>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>다음 실적발표</div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#374151'
                  }}
                >
                  {selectedQuote.earningsDate || '-'}
                </div>
              </div>
              <div style={{ textAlign: 'right', marginLeft: 16 }}>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>기관 보유율</div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#3b82f6'
                  }}
                >
                  {selectedQuote.institutionHoldPct || '-'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                  value={tabIdx <= 2 ? tabIdx : 'default'}
                  onChange={(e) => {
                    if(e.target.value !== 'default') handleTab(Number(e.target.value));
                  }}
                  className="chip"
                  style={{
                    height: '32px',
                    padding: '0 30px 0 12px',
                    border: tabIdx <= 2 ? '1px solid #111827' : '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: tabIdx <= 2 ? '#ffffff' : '#374151',
                    backgroundColor: tabIdx <= 2 ? '#111827' : '#ffffff',
                    cursor: 'pointer',
                    outline: 'none',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='${tabIdx <= 2 ? '%23ffffff' : '%23374151'}' viewBox='0 0 16 16'%3E%3Cpath d='M4 6h8l-4 5z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 10px center'
                  }}
                >
                  <option value="default" disabled={tabIdx <= 2} hidden={tabIdx <= 2}>분봉 ▼</option>
                  <option value={0} style={{ color: '#000', backgroundColor: '#fff' }}>15분봉</option>
                  <option value={1} style={{ color: '#000', backgroundColor: '#fff' }}>30분봉</option>
                  <option value={2} style={{ color: '#000', backgroundColor: '#fff' }}>60분봉</option>
                </select>
                
                {[3, 4, 5].map(i => (
                  <button
                    key={CHART_TABS[i].label}
                    type="button"
                    className="chip"
                    style={{
                      height: '32px',
                      ...(tabIdx === i
                        ? {
                            borderColor: '#111827',
                            backgroundColor: '#111827',
                            color: '#ffffff'
                          }
                        : {})
                    }}
                    onClick={() => handleTab(i)}
                  >
                    {CHART_TABS[i].label}
                  </button>
                ))}
              </div>
              
              <div style={{ position: 'relative' }} onMouseLeave={() => setIndicatorMenuOpen(false)}>
                <button
                  type="button"
                  className="chip"
                  onClick={() => setIndicatorMenuOpen(!indicatorMenuOpen)}
                  style={{ height: '32px', padding: '0 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#374151', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>⚙️ 보조지표 설정</span>
                  <span style={{ fontSize: '10px' }}>{indicatorMenuOpen ? '▲' : '▼'}</span>
                </button>
                
                {indicatorMenuOpen && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', zIndex: 50, display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '160px' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', marginBottom: '8px', letterSpacing: '-0.3px' }}>이동평균선 (EMA)</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                          { p: 10, c: '#dc2626', l: '10일선' },
                          { p: 20, c: '#f97316', l: '20일선' },
                          { p: 50, c: '#2563eb', l: '50일선' }
                        ].map(m => (
                          <label key={m.p} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', margin: 0 }}>
                            <input type="checkbox" checked={showMA[m.p]} onChange={() => setShowMA(prev => ({ ...prev, [m.p]: !prev[m.p] }))} style={{ accentColor: m.c, cursor: 'pointer', width: '14px', height: '14px', margin: 0 }} />
                            <span style={{ color: showMA[m.p] ? m.c : '#6b7280', fontWeight: showMA[m.p] ? 600 : 500 }}>{m.l}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div style={{ height: '1px', backgroundColor: '#f3f4f6' }}></div>
                    
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', marginBottom: '8px', letterSpacing: '-0.3px' }}>기타 지표</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', margin: 0 }}>
                          <input type="checkbox" checked={showIchimoku} onChange={() => setShowIchimoku(prev => !prev)} style={{ accentColor: '#ef4444', cursor: 'pointer', width: '14px', height: '14px', margin: 0 }} />
                          <span style={{ color: showIchimoku ? '#ef4444' : '#6b7280', fontWeight: showIchimoku ? 600 : 500 }}>일목구름(스팬)</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', margin: 0 }}>
                          <input type="checkbox" checked={showSignals} onChange={() => setShowSignals(prev => !prev)} style={{ accentColor: '#f59e0b', cursor: 'pointer', width: '14px', height: '14px', margin: 0 }} />
                          <span style={{ color: showSignals ? '#f59e0b' : '#6b7280', fontWeight: showSignals ? 600 : 500 }}>매매시그널</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div
              ref={chartContainerRef}
              style={{
                marginTop: 4,
                marginBottom: 12,
                cursor: isDragging ? 'grabbing' : 'crosshair',
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
              onMouseDown={(e) => {
                e.preventDefault(); // 글씨가 드래그(선택)되는 것을 완벽하게 방지합니다.
                setIsDragging(true);
                startXRef.current = e.clientX;
              }}
              onMouseMove={(e) => {
                if (!isDragging || chartData.length === 0) return;
                const deltaX = e.clientX - startXRef.current;
                const pixelsPerIndex = 5; // 5픽셀 이동할 때마다 1캔들씩 이동 (드래그 속도 조절)
                
                if (Math.abs(deltaX) >= pixelsPerIndex) {
                  const shift = Math.round(deltaX / pixelsPerIndex);
                  
                  setVisibleRange((prev) => {
                    const currentStartIndex = prev ? prev.startIndex : defaultStartIndex;
                    const currentEndIndex = prev ? prev.endIndex : chartData.length - 1;
                    
                    let newStartIndex = currentStartIndex - shift;
                    let newEndIndex = currentEndIndex - shift;
                    
                    // 차트 양끝 범위를 벗어나지 않게 단단히 고정 (Clamping)
                    if (newStartIndex < 0) {
                      newEndIndex -= newStartIndex;
                      newStartIndex = 0;
                    }
                    if (newEndIndex >= chartData.length) {
                      const diff = newEndIndex - chartData.length + 1;
                      newStartIndex -= diff;
                      newEndIndex = chartData.length - 1;
                    }
                    newStartIndex = Math.max(0, newStartIndex);
                    
                    startXRef.current = e.clientX;
                    return { startIndex: newStartIndex, endIndex: newEndIndex };
                  });
                }
              }}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
            >
              {chartLoading ? (
                <div
                  style={{
                    height: 220,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f9fafb',
                    borderRadius: 10
                  }}
                >
                  <div style={{ fontSize: 22 }}>📈</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                    차트 데이터를 불러오는 중입니다...
                  </div>
                </div>
              ) : chartError ? (
                <div
                  style={{
                    height: 220,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#fef2f2',
                    borderRadius: 10
                  }}
                >
                  <div style={{ fontSize: 13, color: '#b91c1c' }}>{chartError}</div>
                  <button
                    type="button"
                    className="primary-button"
                    style={{ marginTop: 8, padding: '6px 14px', fontSize: 12 }}
                    onClick={() => loadChart(selected, tabIdx)}
                  >
                    다시 시도
                  </button>
                </div>
              ) : chartData.length ? (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={visibleData} syncId="stockChart">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 9 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      yAxisId="price"
                      domain={[chartMin, chartMax]}
                      tick={{ fontSize: 9 }}
                      width={60}
                      tickFormatter={(v) => v.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    />
                    <Tooltip
                      content={<CustomTooltip showMA={showMA} showIchimoku={showIchimoku} />}
                      cursor={{ fill: '#f3f4f6' }}
                    />
                    <YAxis
                      yAxisId="volume"
                      domain={[0, (maxVolume || 1) * 4]} // 거래량 막대가 차트 하단 1/4 영역만 차지하도록 여백을 줍니다.
                      orientation="right"
                      hide={true} // 축 숫자는 숨겨서 깔끔하게 유지합니다.
                    />
                    <Bar
                      yAxisId="price"
                      dataKey={(d) => [d.low || d.close, d.high || d.close]}
                      shape={(props) => <CandlestickShape {...props} showSignals={showSignals} />}
                      isAnimationActive={false}
                    />
                    <Bar yAxisId="volume" dataKey="volume" isAnimationActive={false}>
                      {visibleData.map((entry, index) => {
                        if (entry.close == null) return <Cell key={`cell-${index}`} fill="transparent" />;
                        const isUp = entry.close >= (entry.open ?? entry.close);
                        return (
                          <Cell key={`cell-${index}`} fill={isUp ? '#dc2626' : '#2563eb'} fillOpacity={0.25} />
                        );
                      })}
                    </Bar>
                    {showMA[10] && <Line yAxisId="price" type="monotone" dataKey="ema10" stroke="#dc2626" strokeWidth={1.5} dot={false} strokeOpacity={0.6} isAnimationActive={false} />}
                    {showMA[20] && <Line yAxisId="price" type="monotone" dataKey="ema20" stroke="#f97316" strokeWidth={1.5} dot={false} strokeOpacity={0.6} isAnimationActive={false} />}
                    {showMA[50] && <Line yAxisId="price" type="monotone" dataKey="ema50" stroke="#2563eb" strokeWidth={1.5} dot={false} strokeOpacity={0.6} isAnimationActive={false} />}
                    {showIchimoku && <Area yAxisId="price" dataKey="bullCloud" stroke="none" fill="#ef4444" fillOpacity={0.15} isAnimationActive={false} />}
                    {showIchimoku && <Area yAxisId="price" dataKey="bearCloud" stroke="none" fill="#3b82f6" fillOpacity={0.15} isAnimationActive={false} />}
                    {showIchimoku && <Line yAxisId="price" type="monotone" dataKey="spanA" stroke="#ef4444" strokeWidth={1.5} dot={false} strokeOpacity={0.8} isAnimationActive={false} />}
                    {showIchimoku && <Line yAxisId="price" type="monotone" dataKey="spanB" stroke="#3b82f6" strokeWidth={1.5} dot={false} strokeOpacity={0.8} isAnimationActive={false} />}
                  </ComposedChart>
                </ResponsiveContainer>
                
                <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '16px 0 8px 0' }}></div>

                <ResponsiveContainer width="100%" height={150}>
                  <ComposedChart data={visibleData} syncId="stockChart">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="label" hide={true} />
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fontSize: 9 }}
                      width={60}
                      tickFormatter={(v) => v.toFixed(2)}
                    />
                    <Tooltip content={<div style={{ display: 'none' }} />} cursor={{ fill: '#f3f4f6' }} />
                    <Bar dataKey="macdHist" isAnimationActive={false}>
                      {visibleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.macdHist >= 0 ? '#dc2626' : '#2563eb'} fillOpacity={0.5} />
                      ))}
                    </Bar>
                    <Line type="monotone" dataKey="macd" stroke="#2563eb" strokeWidth={1.5} dot={<MacdSignalDot />} isAnimationActive={false} />
                    <Line type="monotone" dataKey="macdSignal" stroke="#f97316" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  </ComposedChart>
                </ResponsiveContainer>
                </>
              ) : (
                <div
                  style={{
                    height: 220,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f9fafb',
                    borderRadius: 10,
                    color: '#9ca3af',
                    fontSize: 13
                  }}
                >
                  차트 데이터 없음
                </div>
              )}
            </div>

            <div style={{ marginTop: 24, borderTop: '1px solid #e5e7eb', paddingTop: 20 }}>
              <div
                className="section-title"
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={() => setShowInvestmentTrend(!showInvestmentTrend)}
              >
                <span>👥 수급 동향 및 분석 (최근 10일)</span>
                <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 'normal' }}>{showInvestmentTrend ? '▲ 접기' : '▼ 펼치기'}</span>
              </div>
              {showInvestmentTrend && (
                <div style={{ paddingBottom: 8 }}>
                  {investorTrendLoading ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: '#6b7280', fontSize: 13 }}>
                      수급 데이터를 불러오는 중입니다...
                    </div>
                  ) : investorTrendData.length > 0 ? (
                    <>
                      <div style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#374151', lineHeight: 1.5, border: '1px solid #e2e8f0' }}>
                        {(() => {
                          const recent = investorTrendData.slice(-3);
                          const recentFor = recent.reduce((acc, curr) => acc + curr.foreigner, 0);
                          const recentInst = recent.reduce((acc, curr) => acc + curr.institution, 0);
                          if (recentFor > 0 && recentInst > 0) {
                            return <span>🔥 <strong>최근 3일간 외국인과 기관의 '쌍끌이 매수'</strong>가 나타나고 있습니다. 긍정적인 수급 신호입니다.</span>;
                          } else if (recentFor > 0) {
                            return <span>📈 <strong>외국인이 매수세를 주도</strong>하고 있습니다. 단발성인지 연속적인지 체크하세요.</span>;
                          } else if (recentInst > 0) {
                            return <span>📈 <strong>기관이 매수세를 주도</strong>하고 있습니다. 주가 하방 경직성이 확보될 가능성이 높습니다.</span>;
                          } else {
                            return <span>📉 <strong>외국인과 기관이 매도 우위</strong>를 보이며, 개인이 물량을 받고 있습니다. 수급 개선을 기다리는 것이 좋습니다.</span>;
                          }
                        })()}
                      </div>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={investorTrendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5).replace('-','/')} />
                          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatFinValue(v, 'compact')} />
                          <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(val) => new Intl.NumberFormat('ko-KR').format(val)} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <ReferenceLine y={0} stroke="#9ca3af" />
                          <Bar dataKey="retail" name="개인" fill="#2563eb" />
                          <Bar dataKey="foreigner" name="외국인" fill="#dc2626" />
                          <Bar dataKey="institution" name="기관" fill="#f59e0b" />
                        </BarChart>
                      </ResponsiveContainer>
                      <div style={{ textAlign: 'right', fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                        * 미국 등 일부 해외 주식은 거래량 기반 수급 추정치입니다.
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af', fontSize: 13 }}>데이터가 없습니다.</div>
                  )}

                  <div style={{ marginTop: 16, backgroundColor: '#f9fafb', padding: 16, borderRadius: 8 }}>
                    <strong style={{ color: '#111827', fontSize: 13, display: 'block', marginBottom: 8 }}>💡 수급 분석 핵심 가이드</strong>
                    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: '#4b5563', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <li><strong>외국인 (연속성):</strong> 막대한 자금력을 갖춘 주도 세력입니다. 5~10일 이상 꾸준히 매집하는지 확인하세요.</li>
                      <li><strong>기관 (안정성):</strong> 지분율이 높으면 하락 시 방어 매수가 들어와 급락 가능성이 낮아집니다.</li>
                      <li><strong>개인 (반대 매매):</strong> 개인이 대량 매도하고 외국인·기관이 그 물량을 받아낼 때가 좋은 매수 타점인 경우가 많습니다.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

              <MaGuide data={chartData} />

              <div style={{ marginTop: 24, borderTop: '1px solid #e5e7eb', paddingTop: 24, marginBottom: 12 }}>
                <button
                  type="button"
                  className="primary-button"
                  style={{ width: '100%', padding: '12px', fontSize: '15px', fontWeight: 'bold', backgroundColor: '#059669', borderColor: '#059669', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.2)' }}
                  onClick={() => { setAiModalOpen(true); handleAiAnalysis(4); }}
                >
                  🕵️‍♂️ AI 포렌식 정밀 분석 시작
                </button>
              </div>
          </div>
        )}
      </div>

      {searchOpen && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setSearchOpen(false);
            setSearchQuery('');
            setSearchResults([]);
          }}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="modal-title">종목 추가</h3>
            <p className="modal-subtitle">
              국내 주식과 해외 주식의 종목을 검색하여 추가해보세요.
            </p>
            <div className="modal-input-row">
              <input
                className="modal-input"
                placeholder="예: AAPL, 애플, 삼성전자, 005930"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    void doSearch(searchQuery);
                  }
                }}
              />
              <button
                type="button"
                className="primary-button"
                style={{ padding: '8px 14px', fontSize: 12 }}
                disabled={!searchQuery.trim()}
                onClick={() => void doSearch(searchQuery)}
              >
                검색
              </button>
            </div>
            <div
              style={{
                maxHeight: 180,
                overflowY: 'auto',
                marginBottom: 8
              }}
            >
              {searchLoading && (
                <div style={{ fontSize: 12, color: '#6b7280' }}>검색 중...</div>
              )}
              {!searchLoading &&
                searchResults.map((r) => (
                  <div
                    key={r.symbol}
                    className="modal-result-item"
                    onClick={() => handleAddFromSearch(r.symbol)}
                  >
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {r.shortname} ({r.symbol.replace(/\.(KS|KQ)$/i, '')})
                      {(() => {
                        const badge = getMarketBadge(r.symbol, r.exchange);
                        return (
                          <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 5px', borderRadius: '4px', backgroundColor: badge.bg, color: badge.color, flexShrink: 0 }}>
                            {badge.text}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              {!searchLoading && !searchResults.length && searchQuery.trim() && (
                <div style={{ fontSize: 12, color: '#9ca3af' }}>
                  검색 결과가 없습니다.
                </div>
              )}
            </div>
            <button
              type="button"
              className="secondary-button"
              style={{ width: '100%', marginTop: 4 }}
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {aiModalOpen && (
        <div className="modal-backdrop" onClick={() => setAiModalOpen(false)} style={{ zIndex: 1000 }}>
          <div className="modal-card" style={{ maxWidth: '700px', width: '90%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="modal-title" style={{ margin: 0 }}>🤖 {selectedQuote?.name} AI 딥다이브</h3>
              <button type="button" style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#9ca3af' }} onClick={() => setAiModalOpen(false)}>×</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="primary-button" 
                  style={{ flex: 1, backgroundColor: aiMode === 1 ? '#4f46e5' : '#9ca3af', borderColor: aiMode === 1 ? '#4f46e5' : '#9ca3af', fontSize: '13px' }} 
                  onClick={() => handleAiAnalysis(1)} disabled={aiLoading}
                >
                  📈 기술적 분석
                </button>
                <button 
                  className="primary-button" 
                  style={{ flex: 1, backgroundColor: aiMode === 2 ? '#f59e0b' : '#9ca3af', borderColor: aiMode === 2 ? '#f59e0b' : '#9ca3af', fontSize: '13px' }} 
                  onClick={() => handleAiAnalysis(2)} disabled={aiLoading}
                >
                  📰 실적 요약
                </button>
                <button 
                  className="primary-button" 
                  style={{ flex: 1, backgroundColor: aiMode === 3 ? '#e11d48' : '#9ca3af', borderColor: aiMode === 3 ? '#e11d48' : '#9ca3af', fontSize: '13px' }} 
                  onClick={() => handleAiAnalysis(3)} disabled={aiLoading}
                >
                  🧙‍♂️ 대가 빙의
                </button>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="primary-button" 
                  style={{ flex: 1, backgroundColor: aiMode === 4 ? '#059669' : '#9ca3af', borderColor: aiMode === 4 ? '#059669' : '#9ca3af', fontSize: '13px' }} 
                  onClick={() => handleAiAnalysis(4)} disabled={aiLoading}
                >
                  🕵️‍♂️ 1차 포렌식 감사 (수집)
                </button>
                <button 
                  className="primary-button" 
                  style={{ flex: 1, backgroundColor: aiMode === 5 ? '#7c3aed' : '#9ca3af', borderColor: aiMode === 5 ? '#7c3aed' : '#9ca3af', fontSize: '13px' }} 
                  onClick={() => handleAiAnalysis(5)} disabled={aiLoading}
                >
                  ⚖️ 2차 정밀 추론 (평가)
                </button>
              </div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', minHeight: '300px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '20px' }}>
              {aiLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280', fontSize: 14 }}>
                  <div style={{ fontSize: 36, marginBottom: 16 }}>⏳</div>
                  AI가 데이터를 심층 분석하고 있습니다...
                </div>
              ) : aiResult ? (
                <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.7, color: '#374151' }}>{aiResult}</div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {marketExplorerOpen && (
        <div className="modal-backdrop" onClick={() => setMarketExplorerOpen(false)} style={{ zIndex: 1000 }}>
          <div className="modal-card" style={{ maxWidth: '500px', width: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px' }}>
                  {MARKET_EXPLORER_CARDS.find(m => m.id === marketExplorerType)?.icon}
                </div>
                <h3 className="modal-title" style={{ margin: 0 }}>
                  {MARKET_EXPLORER_CARDS.find(m => m.id === marketExplorerType)?.modalTitle}
                </h3>
              </div>
              <button type="button" style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#9ca3af' }} onClick={() => setMarketExplorerOpen(false)}>×</button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '12px' }}>
              {marketExplorerLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280', fontSize: 14 }}>
                  <div style={{ fontSize: 36, marginBottom: 16 }}>⏳</div>
                  시장 구성 종목을 불러오는 중입니다...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ marginBottom: '8px', position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f8fafc', paddingBottom: '4px' }}>
                    <input
                      type="text"
                      className="modal-input"
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '14px', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}
                      placeholder="🔍 종목명 또는 심볼(티커) 검색..."
                      value={marketExplorerSearch}
                      onChange={(e) => setMarketExplorerSearch(e.target.value)}
                    />
                  </div>
                  {filteredMarketExplorerData.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: '#9ca3af', fontSize: 14 }}>검색 결과가 없습니다.</div>
                  ) : filteredMarketExplorerData.map((item, idx) => {
                    const isAdded = watchlist.includes(item.symbol);
                    return (
                      <div key={item.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                          <div style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '14px', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: '1px solid #e2e8f0', flexShrink: 0 }}>{idx + 1}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: '#111827', fontSize: '16px', wordBreak: 'keep-all', lineHeight: '1.2' }}>
                              {item.name} <span style={{ fontSize: '14px', fontWeight: 500, color: '#6b7280' }}>({item.symbol.replace(/\.(KS|KQ)$/i, '')})</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            className={isAdded ? "secondary-button" : "primary-button"} 
                            style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 'bold', borderRadius: '8px', ...(isAdded ? { backgroundColor: '#f3f4f6', color: '#9ca3af', borderColor: '#e5e7eb' } : {}) }}
                            onClick={() => {
                              if (!isAdded) setWatchlist((prev) => [...prev, item.symbol]);
                            }}
                            disabled={isAdded}
                          >
                            {isAdded ? '추가됨' : '관심종목 추가'}
                          </button>
                          <button 
                            className="secondary-button" 
                            style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 'bold', borderRadius: '8px' }}
                            onClick={() => {
                              if (!isAdded) setWatchlist((prev) => [...prev, item.symbol]);
                              handleSelect(item.symbol);
                              setMarketExplorerOpen(false);
                            }}
                          >
                            차트 보기
                          </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {aiRecommendModalOpen && (
        <div className="modal-backdrop" onClick={() => setAiRecommendModalOpen(false)} style={{ zIndex: 1000 }}>
          <div className="modal-card" style={{ maxWidth: '700px', width: '90%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="modal-title" style={{ margin: 0 }}>✨ AI 차트 매매 종목 추천</h3>
              <button type="button" style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#9ca3af' }} onClick={() => setAiRecommendModalOpen(false)}>×</button>
            </div>
            
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
              각 시장의 대표 종목들을 대상으로 AI가 최근 20일간의 차트 흐름을 스캔하여 기술적 매매 관점의 최우선 추천 종목 TOP 3를 선정합니다.
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {['KOSPI', 'KOSDAQ', 'NASDAQ', 'SP500'].map((market) => (
                <button
                  key={market}
                  className="primary-button"
                  style={{ flex: 1, backgroundColor: aiRecommendMarket === market ? '#8b5cf6' : '#9ca3af', borderColor: aiRecommendMarket === market ? '#8b5cf6' : '#9ca3af', fontSize: '13px' }}
                  onClick={() => handleAiRecommend(market)}
                  disabled={aiRecommendLoading}
                >
                  {market} 분석
                </button>
              ))}
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', minHeight: '300px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '20px' }}>
              {aiRecommendLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280', fontSize: 14 }}>
                  <div style={{ fontSize: 36, marginBottom: 16 }}>⏳</div>
                  AI가 {aiRecommendMarket} 시장의 종목 차트를 스캔하고 있습니다...<br />(약 10~20초 소요)
                </div>
              ) : aiRecommendResult ? (
                <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.7, color: '#374151' }}>{aiRecommendResult}</div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: 14 }}>
                  위 시장 버튼을 눌러 AI 스캐너 분석을 시작하세요.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
