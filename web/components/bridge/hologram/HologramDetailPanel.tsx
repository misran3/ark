'use client';

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Html } from '@react-three/drei';
import type { Asset, AssetStatus, CostBreakdown } from '@/lib/stores/asset-store';
import { useTextDecode } from '@/hooks/useTextDecode';

// ── Status colors ────────────────────────────────────────────────
const STATUS_COLORS: Record<AssetStatus, string> = {
  NOMINAL: '#44ffaa',
  CAUTION: '#ffaa44',
  CRITICAL: '#ff4444',
};

// ── Currency / percent formatting ────────────────────────────────
const fmt = (v: number) => `$${v.toLocaleString('en-US')}`;
const pct = (v: number, sign = false) =>
  `${sign && v > 0 ? '+' : ''}${v.toFixed(1)}%`;

// ── Deep scan row renderers per asset type ───────────────────────
function renderDeepScanRows(asset: Asset, isDecoding: boolean): React.ReactNode[] {
  const rows: React.ReactNode[] = [];
  const ds = asset.deepScan;

  switch (asset.type) {
    case 'real-estate':
      if (ds.purchasePrice != null) rows.push(<DecodedRow key="pp" label="Purchase Price" value={fmt(ds.purchasePrice)} active={isDecoding} delay={0} />);
      if (ds.appreciationRate != null) rows.push(<DecodedRow key="ar" label="Appreciation Rate" value={pct(ds.appreciationRate, true) + '/yr'} active={isDecoding} delay={50} />);
      if (ds.monthlyCost != null) rows.push(<DecodedRow key="mc" label="Monthly Cost" value={fmt(ds.monthlyCost)} active={isDecoding} delay={100} />);
      if (ds.costBreakdown) rows.push(...renderBreakdown(ds.costBreakdown, isDecoding, 150));
      if (ds.equityBuilt != null) rows.push(<DecodedRow key="eq" label="Equity Built" value={fmt(ds.equityBuilt)} active={isDecoding} delay={250} />);
      break;

    case 'investment':
      if (ds.allocation) {
        const alloc = ds.allocation.map((a) => `${a.label} ${a.pct}%`).join(' / ');
        rows.push(<DecodedRow key="al" label="Allocation" value={alloc} active={isDecoding} delay={0} />);
      }
      if (ds.ytdReturn != null) rows.push(<DecodedRow key="yr" label="YTD Return" value={pct(ds.ytdReturn, true)} active={isDecoding} delay={50} />);
      if (ds.monthlyContribution != null) rows.push(<DecodedRow key="mc" label="Monthly Contribution" value={fmt(ds.monthlyContribution)} active={isDecoding} delay={100} />);
      break;

    case 'vehicle':
      if (ds.purchasePrice != null) rows.push(<DecodedRow key="pp" label="Purchase Price" value={fmt(ds.purchasePrice)} active={isDecoding} delay={0} />);
      if (ds.depreciationRate != null) rows.push(<DecodedRow key="dr" label="Depreciation Rate" value={pct(ds.depreciationRate) + '/yr'} active={isDecoding} delay={50} />);
      if (ds.monthlyCost != null) rows.push(<DecodedRow key="mc" label="Monthly Cost" value={fmt(ds.monthlyCost)} active={isDecoding} delay={100} />);
      if (ds.costBreakdown) rows.push(...renderBreakdown(ds.costBreakdown, isDecoding, 150));
      if (ds.mileage != null) rows.push(<DecodedRow key="mi" label="Mileage" value={ds.mileage.toLocaleString()} active={isDecoding} delay={250} />);
      break;

    case 'savings':
      if (ds.apy != null) rows.push(<DecodedRow key="apy" label="APY" value={pct(ds.apy)} active={isDecoding} delay={0} />);
      if (ds.monthlyDeposit != null) rows.push(<DecodedRow key="md" label="Monthly Deposit" value={fmt(ds.monthlyDeposit)} active={isDecoding} delay={50} />);
      if (ds.monthsCoverage != null) rows.push(<DecodedRow key="cov" label="Coverage" value={`${ds.monthsCoverage.toFixed(1)} months`} active={isDecoding} delay={100} />);
      break;

    case 'crypto':
      if (ds.holdings) rows.push(<DecodedRow key="hd" label="Holdings" value={ds.holdings.join(' / ')} active={isDecoding} delay={0} />);
      if (ds.volatility30d != null) rows.push(<DecodedRow key="vol" label="30-day Volatility" value={`±${ds.volatility30d}%`} active={isDecoding} delay={50} />);
      if (ds.costBasis != null) rows.push(<DecodedRow key="cb" label="Cost Basis" value={fmt(ds.costBasis)} active={isDecoding} delay={100} />);
      break;
  }

  return rows;
}

function renderBreakdown(items: CostBreakdown[], isDecoding: boolean, baseDelay: number): React.ReactNode[] {
  return items.map((item, i) => (
    <DecodedRow
      key={`bd-${i}`}
      label={`  ${item.label}`}
      value={fmt(item.amount)}
      active={isDecoding}
      delay={baseDelay + i * 30}
      indent
    />
  ));
}

// ── Decoded row with text scramble ───────────────────────────────
function DecodedRow({
  label,
  value,
  active,
  delay,
  indent,
}: {
  label: string;
  value: string;
  active: boolean;
  delay: number;
  indent?: boolean;
}) {
  const { display: decodedValue } = useTextDecode(value, active, { duration: 200, delay });

  return (
    <div
      className="flex justify-between items-baseline"
      style={{
        marginBottom: '3px',
        paddingLeft: indent ? '10px' : 0,
        fontSize: indent ? '10px' : '11px',
      }}
    >
      <span style={{ opacity: indent ? 0.4 : 0.6 }}>{label}</span>
      <span style={{ fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace' }}>
        {decodedValue}
      </span>
    </div>
  );
}

// ── Shared panel shell ───────────────────────────────────────────
interface BasePanelProps {
  position: [number, number, number];
  color: string;
  glowColor: string;
  onClose: () => void;
}

// Legacy mode: generic children-based panel (used by DefenseGrid, FleetCommand, StarChart)
interface LegacyPanelProps extends BasePanelProps {
  children: React.ReactNode;
  asset?: undefined;
}

// Asset mode: tiered reveal panel (used by AssetNavigation)
interface AssetPanelProps extends BasePanelProps {
  asset: Asset;
  isDeepScan: boolean;
  onDeepScan: () => void;
  onCollapse: () => void;
  children?: undefined;
}

type HologramDetailPanelProps = LegacyPanelProps | AssetPanelProps;

export function HologramDetailPanel(props: HologramDetailPanelProps) {
  const { position, color, glowColor, onClose } = props;
  const panelRef = useRef<HTMLDivElement>(null);

  // Click-outside-to-dismiss
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [onClose]);

  return (
    <Html center position={position} style={{ pointerEvents: 'auto' }} zIndexRange={[100, 0]}>
      <div
        ref={panelRef}
        className="font-mono text-xs"
        style={{
          background: 'rgba(3, 8, 24, 0.88)',
          border: `1px solid ${color}`,
          borderRadius: '4px',
          padding: '12px 14px',
          minWidth: props.asset ? '240px' : '220px',
          maxWidth: props.asset ? '300px' : '280px',
          color: 'rgba(200, 210, 230, 0.9)',
          boxShadow: `0 0 20px ${glowColor}, inset 0 0 10px rgba(0,0,0,0.5)`,
          backdropFilter: 'blur(8px)',
          transition: 'max-height 300ms ease, opacity 300ms ease',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-1 right-2 opacity-40 hover:opacity-80 transition-opacity"
          style={{ color, fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          x
        </button>

        {props.asset ? (
          <AssetScanContent
            asset={props.asset}
            color={color}
            isDeepScan={props.isDeepScan}
            onDeepScan={props.onDeepScan}
            onCollapse={props.onCollapse}
          />
        ) : (
          props.children
        )}
      </div>
    </Html>
  );
}

// ── Asset scan content (tiered reveal) ───────────────────────────
function AssetScanContent({
  asset,
  color,
  isDeepScan,
  onDeepScan,
  onCollapse,
}: {
  asset: Asset;
  color: string;
  isDeepScan: boolean;
  onDeepScan: () => void;
  onCollapse: () => void;
}) {
  const [isDecoding, setIsDecoding] = useState(false);

  // Trigger decode animation when deep scan activates
  useEffect(() => {
    if (isDeepScan) {
      setIsDecoding(true);
      const timer = setTimeout(() => setIsDecoding(false), 1200);
      return () => clearTimeout(timer);
    }
    setIsDecoding(false);
  }, [isDeepScan]);

  const statusColor = STATUS_COLORS[asset.status];
  const trendColor = asset.trendPct >= 0 ? '#44ff88' : '#ff4444';

  const buttonStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    marginTop: '10px',
    padding: '4px 0',
    background: 'none',
    border: `1px solid ${color}`,
    borderRadius: '2px',
    color,
    fontSize: '10px',
    letterSpacing: '1.5px',
    cursor: 'pointer',
    opacity: 0.7,
    transition: 'opacity 200ms',
  };

  return (
    <>
      {/* Header */}
      <div
        style={{
          color,
          fontSize: '10px',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          marginBottom: '6px',
          textShadow: `0 0 6px ${color}`,
        }}
      >
        ◆ ASSET SCAN REPORT
      </div>

      {/* Divider */}
      <div
        style={{
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          margin: '0 0 8px 0',
          opacity: 0.3,
        }}
      />

      {/* Asset name — larger */}
      <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px', letterSpacing: '0.5px' }}>
        {asset.name}
      </div>

      {/* Status badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', marginBottom: '10px' }}>
        <span
          style={{
            display: 'inline-block',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: statusColor,
            boxShadow: `0 0 4px ${statusColor}`,
          }}
        />
        <span style={{ color: statusColor, letterSpacing: '1px' }}>{asset.status}</span>
      </div>

      {/* Current value — hero number */}
      <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '2px', fontVariantNumeric: 'tabular-nums' }}>
        {fmt(asset.value)}
      </div>

      {/* Trend arrow + share on same line */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
        <span style={{ color: trendColor, fontSize: '11px', fontVariantNumeric: 'tabular-nums' }}>
          {asset.trendPct >= 0 ? '▲' : '▼'} {pct(asset.trendPct, true)}
        </span>
        <span style={{ opacity: 0.5, fontSize: '10px' }}>
          {pct(asset.netWorthShare)} of net worth
        </span>
      </div>

      {/* Deep scan section */}
      {isDeepScan ? (
        <>
          <div style={{ borderTop: `1px dashed ${color}`, margin: '0 0 8px', opacity: 0.25 }} />
          {renderDeepScanRows(asset, isDecoding)}
          <button
            onClick={onCollapse}
            style={buttonStyle}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '1'; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = '0.7'; }}
          >
            ▲ COLLAPSE SCAN
          </button>
        </>
      ) : (
        <button
          onClick={onDeepScan}
          style={buttonStyle}
          onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '1'; }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = '0.7'; }}
        >
          ▼ SCAN DEEPER
        </button>
      )}
    </>
  );
}

/** Reusable styled sub-components for other panels */

export function DetailHeader({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        color,
        fontSize: '11px',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        marginBottom: '8px',
        textShadow: `0 0 6px ${color}`,
      }}
    >
      {children}
    </div>
  );
}

export function DetailRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-baseline" style={{ marginBottom: '4px' }}>
      <span style={{ opacity: 0.6 }}>{label}</span>
      <span style={{ color: color || 'inherit', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}

export function DetailDivider({ color }: { color: string }) {
  return (
    <div
      style={{
        height: '1px',
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        margin: '8px 0',
        opacity: 0.3,
      }}
    />
  );
}

export function DetailList({ items, color }: { items: string[]; color: string }) {
  return (
    <div style={{ marginTop: '4px' }}>
      {items.map((item, i) => (
        <div key={i} style={{ marginBottom: '2px', paddingLeft: '8px' }}>
          <span style={{ color, marginRight: '6px' }}>+</span>
          {item}
        </div>
      ))}
    </div>
  );
}
