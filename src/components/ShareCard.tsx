'use client';

import { FoodScoreResult } from '@/lib/types';
import { useState, useCallback } from 'react';

interface ShareCardProps {
  result: FoodScoreResult;
}

function gradeEmoji(grade: string): string {
  switch (grade) {
    case 'A': return '🟢';
    case 'B': return '🟩';
    case 'C': return '🟡';
    case 'D': return '🟠';
    case 'E': return '🔴';
    default:  return '⚪';
  }
}

/** Draw the share card onto a canvas and return a Blob */
async function renderCardToBlob(result: FoodScoreResult): Promise<Blob> {
  const W = 600;
  const H = 340;

  const canvas = document.createElement('canvas');
  canvas.width = W * 2;   // retina
  canvas.height = H * 2;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(2, 2);

  // ── Background gradient ──────────────────────────────────────────────────
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#ecfdf5');
  grad.addColorStop(1, '#f0fdf4');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // ── Left accent bar ───────────────────────────────────────────────────────
  const accent = ctx.createLinearGradient(0, 0, 0, H);
  accent.addColorStop(0, '#059669');
  accent.addColorStop(1, '#0d9488');
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.roundRect(0, 0, 6, H, [0, 3, 3, 0]);
  ctx.fill();

  // ── Score circle ──────────────────────────────────────────────────────────
  const cx = 80; const cy = H / 2;
  const r = 52;
  // track
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = '#d1fae5';
  ctx.lineWidth = 9;
  ctx.stroke();
  // arc
  if (!result.scoringFailed) {
    const pct = result.overallScore / 100;
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
    ctx.strokeStyle = result.gradeColor;
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  // score text
  ctx.fillStyle = result.scoringFailed ? '#9ca3af' : result.gradeColor;
  ctx.font = 'bold 26px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(result.scoringFailed ? '?' : String(Math.round(result.overallScore)), cx, cy - 8);
  ctx.fillStyle = '#6b7280';
  ctx.font = '11px Inter, system-ui, sans-serif';
  ctx.fillText('/100', cx, cy + 14);

  // ── Grade badge ───────────────────────────────────────────────────────────
  ctx.fillStyle = result.scoringFailed ? '#e5e7eb' : result.gradeColor;
  ctx.beginPath();
  ctx.roundRect(cx - 22, cy + 30, 44, 22, 11);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${result.grade} — ${result.gradeLabel}`, cx, cy + 41);

  // ── Product name ──────────────────────────────────────────────────────────
  const nameX = 158;
  const name = result.product.product_name || 'Unknown Product';
  const truncName = name.length > 38 ? name.slice(0, 35) + '…' : name;

  ctx.fillStyle = '#111827';
  ctx.font = 'bold 20px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(truncName, nameX, 56);

  // brand
  if (result.product.brands) {
    const brand = result.product.brands.split(',')[0].trim();
    ctx.fillStyle = '#6b7280';
    ctx.font = '13px Inter, system-ui, sans-serif';
    ctx.fillText(brand, nameX, 84);
  }

  // ── Key nutrient pills ────────────────────────────────────────────────────
  const n = result.product.nutriments;
  const pills: { label: string; value: string; ok: boolean }[] = [];

  if (n.sugars_100g != null)        pills.push({ label: 'Sugar', value: `${n.sugars_100g.toFixed(1)}g`, ok: n.sugars_100g <= 10 });
  if (n.fat_100g != null)           pills.push({ label: 'Fat',   value: `${n.fat_100g.toFixed(1)}g`,   ok: n.fat_100g <= 15 });
  if (n.proteins_100g != null)      pills.push({ label: 'Protein', value: `${n.proteins_100g.toFixed(1)}g`, ok: n.proteins_100g >= 5 });
  if (n.sodium_100g != null)        pills.push({ label: 'Sodium', value: `${Math.round(n.sodium_100g * 1000)}mg`, ok: n.sodium_100g <= 0.3 });
  if (n.energy_100g != null)        pills.push({ label: 'Energy', value: `${n.energy_100g}kcal`, ok: n.energy_100g <= 300 });

  const pillY = 114;
  let pillX = nameX;
  for (const pill of pills.slice(0, 4)) {
    const label = `${pill.label}: ${pill.value}`;
    ctx.font = '11px Inter, system-ui, sans-serif';
    const tw = ctx.measureText(label).width + 16;
    ctx.fillStyle = pill.ok ? '#dcfce7' : '#fee2e2';
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, tw, 22, 11);
    ctx.fill();
    ctx.fillStyle = pill.ok ? '#15803d' : '#b91c1c';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, pillX + 8, pillY + 11);
    pillX += tw + 8;
    if (pillX > W - 30) break;
  }

  // ── Top 2 warnings or positives ───────────────────────────────────────────
  const items = result.warnings.length > 0 ? result.warnings : result.positives;
  const isWarn = result.warnings.length > 0;
  let textY = 155;
  for (const item of items.slice(0, 2)) {
    const txt = item.length > 60 ? item.slice(0, 57) + '…' : item;
    ctx.fillStyle = isWarn ? '#b91c1c' : '#15803d';
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText((isWarn ? '⚠ ' : '✓ ') + txt, nameX, textY);
    textY += 20;
  }

  // ── Divider ───────────────────────────────────────────────────────────────
  ctx.strokeStyle = '#d1fae5';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(24, H - 52);
  ctx.lineTo(W - 24, H - 52);
  ctx.stroke();

  // ── Footer branding ───────────────────────────────────────────────────────
  ctx.fillStyle = '#059669';
  ctx.font = 'bold 13px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('🌿 FoodScore India', 24, H - 28);

  ctx.fillStyle = '#9ca3af';
  ctx.font = '11px Inter, system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('foodscore-india.vercel.app', W - 24, H - 28);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob failed'));
    }, 'image/png');
  });
}

/** Build WhatsApp-optimised text */
function buildShareText(result: FoodScoreResult): string {
  const name = result.product.product_name || 'this product';
  const score = result.scoringFailed ? '?' : Math.round(result.overallScore);
  const grade = result.grade;
  const emoji = gradeEmoji(grade);
  const warn = result.warnings[0] ?? result.positives[0] ?? '';
  return (
    `${emoji} *${name}*\n` +
    `Health Score: *${score}/100 (${grade} — ${result.gradeLabel})*\n` +
    (warn ? `${result.warnings.length > 0 ? '⚠' : '✓'} ${warn}\n` : '') +
    `\nScanned on FoodScore India 🌿\nfoodscore-india.vercel.app`
  );
}

export default function ShareCard({ result }: ShareCardProps) {
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  const handleShare = useCallback(async () => {
    setSharing(true);
    try {
      const text = buildShareText(result);

      // Try native Web Share API with image first (Android Chrome)
      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          const blob = await renderCardToBlob(result);
          const file = new File([blob], 'foodscore.png', { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], text });
            return;
          }
        } catch {
          // image share not supported, fall through to text share
        }

        // Text-only share (iOS Safari, older Android)
        try {
          await navigator.share({ text });
          return;
        } catch {
          // User dismissed or share failed — fall through to copy
        }
      }

      // Fallback: copy text to clipboard + show panel
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setShowPanel(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Share failed:', err);
      setShowPanel(true);
    } finally {
      setSharing(false);
    }
  }, [result]);

  const handleDownload = useCallback(async () => {
    try {
      const blob = await renderCardToBlob(result);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `foodscore-${(result.product.product_name || 'product').replace(/\s+/g, '-').toLowerCase()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  }, [result]);

  return (
    <div className="mt-4">
      {/* Share button */}
      <button
        id="share-result-btn"
        onClick={handleShare}
        disabled={sharing}
        className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-semibold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
      >
        {sharing ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Generating card…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share Result on WhatsApp
          </>
        )}
      </button>

      {/* Fallback panel when Web Share API isn't available */}
      {showPanel && (
        <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 space-y-3">
          <p className="text-sm text-emerald-800 font-medium">
            {copied ? '✅ Text copied to clipboard!' : 'Share this result:'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex-1 py-2 px-3 bg-white border border-emerald-200 rounded-xl text-sm text-emerald-700 font-medium hover:bg-emerald-50 transition flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Save Image
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(buildShareText(result));
                setCopied(true);
                setTimeout(() => setCopied(false), 3000);
              }}
              className="flex-1 py-2 px-3 bg-white border border-emerald-200 rounded-xl text-sm text-emerald-700 font-medium hover:bg-emerald-50 transition flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {copied ? 'Copied!' : 'Copy Text'}
            </button>
          </div>
          <button onClick={() => setShowPanel(false)} className="text-xs text-gray-400 w-full text-center">Dismiss</button>
        </div>
      )}
    </div>
  );
}
