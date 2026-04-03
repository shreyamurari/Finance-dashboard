import * as XLSX from 'xlsx';

function pad2(n) {
  return String(n).padStart(2, '0');
}

function toIsoDateParts(year, month, day) {
  if (!year || !month || !day) return '';
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function isoToLocalDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso).trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/**
 * Normalizes common Excel date representations into YYYY-MM-DD.
 * Handles:
 * - JS Date objects (when SheetJS uses cellDates:true)
 * - Excel serial numbers (e.g. 45321)
 * - Strings like 2026-03-05, 3/5/2026, 13/2/2026, 03.05.2026
 */
export function normalizeExcelDate(value) {
  if (value == null) return '';

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '';
    return toIsoDateParts(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed || !parsed.y || !parsed.m || !parsed.d) return '';
    return toIsoDateParts(parsed.y, parsed.m, parsed.d);
  }

  const s = String(value).trim();
  if (!s) return '';

  // Already ISO-ish
  const iso = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/.exec(s);
  if (iso) {
    const y = Number(iso[1]);
    const m = Number(iso[2]);
    const d = Number(iso[3]);
    const dt = new Date(y, m - 1, d);
    return Number.isNaN(dt.getTime()) ? '' : toIsoDateParts(y, m, d);
  }

  // dd/mm/yyyy or mm/dd/yyyy (also supports -, .)
  const dmy = /^(\d{1,2})[/. -](\d{1,2})[/. -](\d{4})$/.exec(s);
  if (dmy) {
    const a = Number(dmy[1]);
    const b = Number(dmy[2]);
    const y = Number(dmy[3]);

    // Heuristic:
    // - if a > 12 => definitely day/month
    // - else if b > 12 => definitely month/day
    // - else default to day/month (common in many locales)
    let day;
    let month;
    if (a > 12) {
      day = a;
      month = b;
    } else if (b > 12) {
      month = a;
      day = b;
    } else {
      day = a;
      month = b;
    }

    const dt = new Date(y, month - 1, day);
    if (Number.isNaN(dt.getTime())) return '';
    if (dt.getFullYear() !== y || dt.getMonth() !== month - 1 || dt.getDate() !== day) return '';
    return toIsoDateParts(y, month, day);
  }

  // Fallback: let JS parse, then normalize.
  const dt = new Date(s);
  if (!Number.isNaN(dt.getTime())) {
    return toIsoDateParts(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
  }

  return '';
}

export function dateToTimestampMs(value) {
  const iso = normalizeExcelDate(value);
  if (!iso) return Number.NaN;
  const dt = isoToLocalDate(iso);
  return dt ? dt.getTime() : Number.NaN;
}

export function formatDateForDisplay(value, locale = undefined) {
  const iso = normalizeExcelDate(value);
  if (iso) {
    const dt = isoToLocalDate(iso);
    if (dt) return dt.toLocaleDateString(locale);
  }

  // If it was already a string, show it rather than "Invalid Date"
  const s = value == null ? '' : String(value).trim();
  return s || '—';
}

