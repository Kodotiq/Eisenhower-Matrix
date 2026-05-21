"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const defaultRangeDays = 10;

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDefaultRange() {
  const end = new Date();
  end.setHours(0, 0, 0, 0);

  const start = new Date(end);
  start.setDate(end.getDate() - (defaultRangeDays - 1));

  return {
    start: formatDateInput(start),
    end: formatDateInput(end),
  };
}

export function HistoryRangePicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const defaultRange = useMemo(() => getDefaultRange(), []);

  const paramStart = searchParams.get("start") ?? "";
  const paramEnd = searchParams.get("end") ?? "";

  const [startDate, setStartDate] = useState(paramStart || defaultRange.start);
  const [endDate, setEndDate] = useState(paramEnd || defaultRange.end);

  useEffect(() => {
    if (paramStart || paramEnd) {
      setStartDate(paramStart);
      setEndDate(paramEnd);
      return;
    }

    setStartDate(defaultRange.start);
    setEndDate(defaultRange.end);
  }, [paramStart, paramEnd, defaultRange]);

  const applyRange = () => {
    const params = new URLSearchParams();
    if (startDate) {
      params.set("start", startDate);
    }
    if (endDate) {
      params.set("end", endDate);
    }

    const query = params.toString();

    startTransition(() => {
      router.push(query ? `/history?${query}` : "/history");
    });
  };

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">History range</p>
          <p className="text-xs text-slate-500">
            Pick a date range or leave the end empty for a single day.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="text-xs font-semibold text-slate-600">
            Start
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            End
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={applyRange}
              disabled={isPending}
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => {
                startTransition(() => {
                  router.push("/history");
                });
              }}
              disabled={isPending}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-400"
            >
              Last 10 days
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
