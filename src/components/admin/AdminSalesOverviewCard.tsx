import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import type { DemoOrder } from '../../types';
import { formatInr } from '../../utils/format';

type SalesPeriodPreset = 'today' | 'yesterday' | '7days' | 'month' | 'all' | 'custom';

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseLocalDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y || 2026, (m || 1) - 1, d || 1);
}

function shiftLocalDateKey(dateKey: string, deltaDays: number): string {
  const d = parseLocalDateKey(dateKey);
  d.setDate(d.getDate() + deltaDays);
  return toLocalDateKey(d);
}

function formatReadableDate(dateKey: string): string {
  const d = parseLocalDateKey(dateKey);
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

function formatShortDate(dateKey: string): string {
  const d = parseLocalDateKey(dateKey);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
  }).format(d);
}

function isOrderPaid(order: DemoOrder): boolean {
  const canonical = order.paymentDetails?.status;
  if (canonical === 'Paid' || canonical === 'Payment Collected') return true;
  const legacy = String(order.paymentStatus || '').toUpperCase();
  return legacy === 'PAID' || legacy === 'SUCCESS' || legacy === 'PAYMENT_COLLECTED';
}

function isOrderCancelledOrReturned(order: DemoOrder): boolean {
  return (
    order.fulfillmentStatus === 'Cancelled' ||
    order.fulfillmentStatus === 'Returned' ||
    order.fulfillmentStatus === 'Delivery Failed'
  );
}

function isOrderDelivered(order: DemoOrder): boolean {
  return (
    order.fulfillmentStatus === 'Delivered' ||
    order.fulfillmentStatus === 'Completed'
  );
}

function isOrderNew(order: DemoOrder): boolean {
  return (
    order.fulfillmentStatus === 'New Order' ||
    order.fulfillmentStatus === 'New' ||
    order.fulfillmentStatus === 'Demo Placed'
  );
}

interface AdminSalesOverviewCardProps {
  orders: DemoOrder[];
}

export function AdminSalesOverviewCard({ orders }: AdminSalesOverviewCardProps) {
  const todayKey = useMemo(() => toLocalDateKey(new Date()), []);
  const yesterdayKey = useMemo(() => shiftLocalDateKey(todayKey, -1), [todayKey]);

  const [preset, setPreset] = useState<SalesPeriodPreset>('today');
  const [customDate, setCustomDate] = useState<string>(todayKey);
  const [pickerOpen, setPickerOpen] = useState(false);

  const activeSingleDateKey =
    preset === 'today'
      ? todayKey
      : preset === 'yesterday'
        ? yesterdayKey
        : preset === 'custom'
          ? customDate
          : null;

  const { filteredOrders, buttonLabel, periodSubtext, metricPrefix } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let startKey = todayKey;
    let endKey = todayKey;
    let label = 'Today';
    let subtext = formatReadableDate(todayKey);
    let prefix = "Today's";

    if (preset === 'yesterday') {
      startKey = yesterdayKey;
      endKey = yesterdayKey;
      label = 'Yesterday';
      subtext = formatReadableDate(yesterdayKey);
      prefix = "Yesterday's";
    } else if (preset === '7days') {
      startKey = shiftLocalDateKey(todayKey, -6);
      endKey = todayKey;
      label = '7 Days';
      subtext = `${formatShortDate(startKey)} – ${formatShortDate(endKey)}`;
      prefix = '7-Day';
    } else if (preset === 'month') {
      const monthStart = new Date(currentYear, currentMonth, 1);
      startKey = toLocalDateKey(monthStart);
      endKey = todayKey;
      label = 'This Month';
      subtext = new Intl.DateTimeFormat('en-IN', {
        month: 'long',
        year: 'numeric',
      }).format(now);
      prefix = 'Monthly';
    } else if (preset === 'all') {
      startKey = '0000-01-01';
      endKey = '9999-12-31';
      label = 'All Time';
      subtext = 'Complete store history';
      prefix = 'Total';
    } else if (preset === 'custom') {
      const target = customDate || todayKey;
      startKey = target;
      endKey = target;
      label =
        target === todayKey
          ? 'Today'
          : target === yesterdayKey
            ? 'Yesterday'
            : formatShortDate(target);
      subtext = formatReadableDate(target);
      prefix =
        target === todayKey
          ? "Today's"
          : target === yesterdayKey
            ? "Yesterday's"
            : `${formatShortDate(target)}`;
    }

    const matched = orders.filter((order) => {
      if (preset === 'all') return true;
      const parsed = new Date(order.createdAt);
      if (Number.isNaN(parsed.getTime())) return false;
      const orderKey = toLocalDateKey(parsed);
      return orderKey >= startKey && orderKey <= endKey;
    });

    return {
      filteredOrders: matched,
      buttonLabel: label,
      periodSubtext: subtext,
      metricPrefix: prefix,
    };
  }, [orders, preset, customDate, todayKey, yesterdayKey]);

  const metrics = useMemo(() => {
    let salesRevenueInr = 0;
    let paidRevenueInr = 0;
    let pendingOrdersCount = 0;
    let newOrdersCount = 0;
    let deliveredOrdersCount = 0;
    let cancelledOrdersCount = 0;
    let totalItemsSold = 0;

    for (const order of filteredOrders) {
      const amount = Number(order.grandTotalInr) || 0;
      const cancelled = isOrderCancelledOrReturned(order);
      const delivered = isOrderDelivered(order);

      if (cancelled) {
        cancelledOrdersCount += 1;
        continue;
      }

      salesRevenueInr += amount;
      if (isOrderPaid(order)) {
        paidRevenueInr += amount;
      }

      const itemQty = (order.items || []).reduce(
        (sum, item) => sum + (Number(item.quantity) || 1),
        0
      );
      totalItemsSold += itemQty;

      if (delivered) {
        deliveredOrdersCount += 1;
      } else {
        pendingOrdersCount += 1;
        if (isOrderNew(order)) {
          newOrdersCount += 1;
        }
      }
    }

    const unpaidRevenueInr = Math.max(0, salesRevenueInr - paidRevenueInr);

    return {
      totalOrders: filteredOrders.length,
      salesRevenueInr,
      paidRevenueInr,
      unpaidRevenueInr,
      pendingOrdersCount,
      newOrdersCount,
      deliveredOrdersCount,
      cancelledOrdersCount,
      totalItemsSold,
    };
  }, [filteredOrders]);

  function handleSelectPreset(nextPreset: SalesPeriodPreset) {
    setPreset(nextPreset);
    if (nextPreset === 'today') {
      setCustomDate(todayKey);
    } else if (nextPreset === 'yesterday') {
      setCustomDate(yesterdayKey);
    }
    setPickerOpen(false);
  }

  function handleStepDay(delta: -1 | 1) {
    const baseKey = activeSingleDateKey || todayKey;
    const nextKey = shiftLocalDateKey(baseKey, delta);
    if (nextKey > todayKey) return;
    setCustomDate(nextKey);
    if (nextKey === todayKey) {
      setPreset('today');
    } else if (nextKey === yesterdayKey) {
      setPreset('yesterday');
    } else {
      setPreset('custom');
    }
  }

  function handleCustomDateChange(value: string) {
    if (!value) return;
    const clamped = value > todayKey ? todayKey : value;
    setCustomDate(clamped);
    if (clamped === todayKey) {
      setPreset('today');
    } else if (clamped === yesterdayKey) {
      setPreset('yesterday');
    } else {
      setPreset('custom');
    }
    setPickerOpen(false);
  }

  const canStepForward = Boolean(activeSingleDateKey && activeSingleDateKey < todayKey);

  return (
    <section
      aria-label="Sales overview"
      className="overflow-hidden rounded-[22px] border border-[#E6D5FA] bg-white shadow-[0_12px_28px_-16px_rgba(106,17,203,0.24)]"
    >
      {/* Top Primary Revenue Header Band */}
      <div className="bg-gradient-to-br from-[#590BB3] via-[#6A11CB] to-[#9824D8] px-4 pb-4 pt-3.5 text-white">
        {/* Row 1: Title + Right-Side Date Selector Trigger */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0">
            <h3 className="text-[15.5px] font-extrabold leading-tight tracking-tight text-white">
              Sales Overview
            </h3>
            <p className="mt-0.5 truncate text-[11.5px] font-medium text-white/80">
              {periodSubtext}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setPickerOpen((prev) => !prev)}
            aria-expanded={pickerOpen}
            aria-label="Change sales overview date or period"
            className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl border border-white/25 bg-white/15 px-3 text-[12px] font-bold text-white backdrop-blur-xs transition-colors hover:bg-white/22 active:scale-[0.98]"
          >
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{buttonLabel}</span>
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 transition-transform duration-150 ${
                pickerOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {/* Expandable Date & Period Selector Panel */}
        {pickerOpen && (
          <div className="mt-3 space-y-2.5 rounded-2xl border border-white/20 bg-[#2E085E]/55 p-3 backdrop-blur-md">
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
              {(
                [
                  { id: 'today', label: 'Today' },
                  { id: 'yesterday', label: 'Yesterday' },
                  { id: '7days', label: '7 Days' },
                  { id: 'month', label: 'This Month' },
                  { id: 'all', label: 'All Time' },
                ] as const
              ).map((item) => {
                const isActive = preset === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectPreset(item.id)}
                    className={`h-8 cursor-pointer whitespace-nowrap rounded-lg px-2 text-[11.5px] font-bold transition-colors ${
                      isActive
                        ? 'bg-white text-[#590BB3] shadow-xs'
                        : 'bg-white/12 text-white/90 hover:bg-white/20'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 border-t border-white/15 pt-2.5">
              <label
                htmlFor="admin-sales-custom-date"
                className="shrink-0 text-[11px] font-bold text-white/85"
              >
                Pick Date:
              </label>
              <input
                id="admin-sales-custom-date"
                type="date"
                max={todayKey}
                value={customDate}
                onChange={(e) => handleCustomDateChange(e.target.value)}
                className="h-8.5 min-w-0 flex-1 rounded-lg border border-white/25 bg-white px-2.5 text-[12px] font-bold text-[#1E1035] focus:outline-none focus:ring-2 focus:ring-white/60"
              />
            </div>
          </div>
        )}

        {/* Row 2: Hero Sales Metric */}
        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11.5px] font-semibold text-white/80">
              {metricPrefix} Selling
            </p>
            <p className="mt-1 text-[30px] font-extrabold leading-none tracking-tight text-white tabular-nums sm:text-[34px]">
              {formatInr(metrics.salesRevenueInr)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] font-medium text-white/85 tabular-nums">
              {metrics.salesRevenueInr > 0 ? (
                <>
                  <span>Paid {formatInr(metrics.paidRevenueInr)}</span>
                  <span aria-hidden="true">·</span>
                  <span>Due / COD {formatInr(metrics.unpaidRevenueInr)}</span>
                </>
              ) : (
                <span>No sales recorded for this period yet</span>
              )}
            </div>
          </div>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white">
            <TrendingUp className="h-5.5 w-5.5 stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* Bottom 3-Column Metric Row (Orders, Pending, Delivered) */}
      <div className="grid grid-cols-3 divide-x divide-[#EFE3FF] bg-white">
        <Link
          to="/admin/orders"
          className="flex flex-col items-start px-3.5 py-3.5 transition-colors hover:bg-[#FAF6FF]"
        >
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#685782]">
            <ShoppingBag className="h-3.5 w-3.5 text-[#6A11CB]" />
            <span>Orders</span>
          </span>
          <span className="mt-1.5 text-[22px] font-extrabold leading-none text-[#1E1035] tabular-nums">
            {metrics.totalOrders}
          </span>
          <span className="mt-1 text-[11px] font-medium text-[#75648E] tabular-nums">
            {metrics.totalItemsSold} {metrics.totalItemsSold === 1 ? 'item' : 'items'}
          </span>
        </Link>

        <Link
          to="/admin/orders"
          className="flex flex-col items-start px-3.5 py-3.5 transition-colors hover:bg-[#FFFBF2]"
        >
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#685782]">
            <Clock className="h-3.5 w-3.5 text-[#D97706]" />
            <span>Pending</span>
          </span>
          <span
            className={`mt-1.5 text-[22px] font-extrabold leading-none tabular-nums ${
              metrics.pendingOrdersCount > 0 ? 'text-[#D97706]' : 'text-[#1E1035]'
            }`}
          >
            {metrics.pendingOrdersCount}
          </span>
          <span className="mt-1 text-[11px] font-medium text-[#75648E] tabular-nums">
            {metrics.newOrdersCount > 0
              ? `${metrics.newOrdersCount} new`
              : 'To fulfill'}
          </span>
        </Link>

        <Link
          to="/admin/orders"
          className="flex flex-col items-start px-3.5 py-3.5 transition-colors hover:bg-[#F3FCF6]"
        >
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#685782]">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />
            <span>Delivered</span>
          </span>
          <span
            className={`mt-1.5 text-[22px] font-extrabold leading-none tabular-nums ${
              metrics.deliveredOrdersCount > 0 ? 'text-[#16A34A]' : 'text-[#1E1035]'
            }`}
          >
            {metrics.deliveredOrdersCount}
          </span>
          <span className="mt-1 text-[11px] font-medium text-[#75648E] tabular-nums">
            {metrics.cancelledOrdersCount > 0
              ? `${metrics.cancelledOrdersCount} cancelled`
              : 'Completed'}
          </span>
        </Link>
      </div>

      {/* Subtle Footer Bar: Quick Day Navigation + Orders Link */}
      <div className="flex items-center justify-between gap-2 border-t border-[#EFE3FF] bg-[#FCF9FF] px-3.5 py-2">
        {activeSingleDateKey ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleStepDay(-1)}
              aria-label="Previous day"
              className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-[#E5D5FA] bg-white text-[#4A3860] transition-colors hover:border-[#6A11CB] hover:text-[#6A11CB]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleStepDay(1)}
              disabled={!canStepForward}
              aria-label="Next day"
              className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-[#E5D5FA] bg-white text-[#4A3860] transition-colors hover:border-[#6A11CB] hover:text-[#6A11CB] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            {activeSingleDateKey !== todayKey && (
              <button
                type="button"
                onClick={() => handleSelectPreset('today')}
                className="ml-1 cursor-pointer text-[11.5px] font-bold text-[#6A11CB] hover:underline"
              >
                Back to Today
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => handleSelectPreset('today')}
            className="cursor-pointer text-[11.5px] font-bold text-[#6A11CB] hover:underline"
          >
            Jump to Today
          </button>
        )}

        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-0.5 whitespace-nowrap text-[11.5px] font-bold text-[#6A11CB] hover:text-[#FF4D8D]"
        >
          <span>View All Orders</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
