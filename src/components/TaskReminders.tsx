"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Task } from "@/types/task";

type Coordinates = {
  lat: number;
  lon: number;
};

const prayerNames = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
const locationDriftThreshold = 0.05;

function parseDate(value: Date | string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value : new Date(value);
}

function getStartOfDay(base = new Date()) {
  const start = new Date(base);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getNextMidnightDelay() {
  const now = new Date();
  const next = new Date(now);
  next.setDate(now.getDate() + 1);
  next.setHours(0, 0, 5, 0);
  return Math.max(0, next.getTime() - now.getTime());
}

function buildDateFromTime(timeValue: string, base = new Date()) {
  const [hours, minutes] = timeValue.split(":").map((part) => Number(part));
  const next = new Date(base);
  next.setHours(hours || 0, minutes || 0, 0, 0);
  return next;
}

function getQuadrantLabel(task: Task) {
  if (task.urgency === "High" && task.importance === "High") {
    return "Do First";
  }

  if (task.urgency === "Low" && task.importance === "High") {
    return "Schedule";
  }

  if (task.urgency === "High" && task.importance === "Low") {
    return "Delegate";
  }

  return "Eliminate";
}

interface TaskRemindersProps {
  tasks: Task[];
}

export function TaskReminders({ tasks }: TaskRemindersProps) {
  const [isClient, setIsClient] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [midnightTick, setMidnightTick] = useState(0);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [prayerSyncLabel, setPrayerSyncLabel] = useState<string | null>(null);
  const taskTimeoutsRef = useRef<number[]>([]);
  const prayerTimeoutsRef = useRef<number[]>([]);
  const taskRefreshRef = useRef<number | null>(null);
  const prayerRefreshRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastCoordsRef = useRef<Coordinates | null>(null);

  const hasPrayerTasks = useMemo(
    () => tasks.some((task) => task.category === "PRAYER"),
    [tasks],
  );

  const canNotify = isClient && typeof Notification !== "undefined";

  const clearTimeouts = (timeouts: number[]) => {
    timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeouts.length = 0;
  };

  const scheduleNotification = (
    title: string,
    body: string,
    at: Date,
    bucket: number[],
  ) => {
    const delay = at.getTime() - Date.now();
    if (delay <= 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (Notification.permission === "granted") {
        new Notification(title, { body });
      }
    }, delay);

    bucket.push(timeoutId);
  };

  const scheduleMidnightRefresh = (setter: Dispatch<SetStateAction<number>>) => {
    const delay = getNextMidnightDelay();
    return window.setTimeout(() => setter((value) => value + 1), delay);
  };

  const requestPermission = async () => {
    if (!canNotify) {
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
  };

  const syncPrayerTimes = async (coords: Coordinates) => {
    try {
      const response = await fetch(
        `https://api.aladhan.com/v1/timings?latitude=${coords.lat}&longitude=${coords.lon}&method=2`,
      );

      if (!response.ok) {
        throw new Error("Failed to load prayer times.");
      }

      const data = (await response.json()) as {
        data?: { timings?: Record<string, string> };
      };
      const timings = data.data?.timings;
      if (!timings) {
        throw new Error("Prayer times are unavailable.");
      }

      clearTimeouts(prayerTimeoutsRef.current);

      const now = new Date();
      const todayStart = getStartOfDay(now);

      prayerNames.forEach((name) => {
        const rawTime = timings[name];
        if (!rawTime) {
          return;
        }

        const timeValue = rawTime.split(" ")[0] ?? rawTime;
        const reminderAt = buildDateFromTime(timeValue, todayStart);

        if (reminderAt <= now) {
          return;
        }

        scheduleNotification(
          "Prayer time",
          `${name} is now in your area.`,
          reminderAt,
          prayerTimeoutsRef.current,
        );
      });

      if (prayerRefreshRef.current) {
        window.clearTimeout(prayerRefreshRef.current);
      }

      prayerRefreshRef.current = scheduleMidnightRefresh(setMidnightTick);
      setPrayerSyncLabel(
        new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      );
      setLocationError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load prayer times.";
      setLocationError(message);
    }
  };

  const startLocationWatch = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not available in this browser.");
      return;
    }

    if (watchIdRef.current !== null) {
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };

        const lastCoords = lastCoordsRef.current;
        const moved =
          !lastCoords ||
          Math.abs(coords.lat - lastCoords.lat) > locationDriftThreshold ||
          Math.abs(coords.lon - lastCoords.lon) > locationDriftThreshold;

        if (moved) {
          lastCoordsRef.current = coords;
          void syncPrayerTimes(coords);
        }
      },
      (error) => {
        setLocationError(error.message || "Location access is required for prayer times.");
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 10 * 60 * 1000,
      },
    );
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!canNotify) {
      return;
    }

    setPermission(Notification.permission);
  }, [canNotify]);

  useEffect(() => {
    clearTimeouts(taskTimeoutsRef.current);

    if (taskRefreshRef.current) {
      window.clearTimeout(taskRefreshRef.current);
      taskRefreshRef.current = null;
    }

    if (permission !== "granted") {
      return;
    }

    const now = new Date();
    const todayStart = getStartOfDay(now);

    tasks.forEach((task) => {
      if (task.category === "PRAYER" || !task.reminderTime) {
        return;
      }

      const completedAt = parseDate(task.completedAt);
      const isDaily = task.frequency === "DAILY";
      const isActive = isDaily ? !completedAt || completedAt < todayStart : !completedAt;

      if (!isActive) {
        return;
      }

      let reminderAt = buildDateFromTime(task.reminderTime, todayStart);

      if (reminderAt <= now) {
        if (isDaily) {
          reminderAt = new Date(reminderAt.getTime() + 24 * 60 * 60 * 1000);
        } else {
          return;
        }
      }

      scheduleNotification(
        "Task reminder",
        `${task.title} (${getQuadrantLabel(task)})`,
        reminderAt,
        taskTimeoutsRef.current,
      );
    });

    taskRefreshRef.current = scheduleMidnightRefresh(setMidnightTick);

    return () => {
      clearTimeouts(taskTimeoutsRef.current);
      if (taskRefreshRef.current) {
        window.clearTimeout(taskRefreshRef.current);
        taskRefreshRef.current = null;
      }
    };
  }, [permission, tasks, midnightTick]);

  useEffect(() => {
    clearTimeouts(prayerTimeoutsRef.current);

    if (prayerRefreshRef.current) {
      window.clearTimeout(prayerRefreshRef.current);
      prayerRefreshRef.current = null;
    }

    if (permission !== "granted" || !hasPrayerTasks) {
      return;
    }

    startLocationWatch();

    return () => {
      clearTimeouts(prayerTimeoutsRef.current);
      if (prayerRefreshRef.current) {
        window.clearTimeout(prayerRefreshRef.current);
        prayerRefreshRef.current = null;
      }
    };
  }, [permission, hasPrayerTasks, midnightTick]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  return (
    <section className="space-y-3 rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Reminders</p>
          <p className="text-xs text-slate-500">
            Schedule notifications for Do First, Schedule, and prayer tasks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canNotify ? (
            permission === "granted" ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Notifications enabled
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  void requestPermission();
                }}
                className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-700"
              >
                Enable notifications
              </button>
            )
          ) : (
            <span className="text-xs font-semibold text-rose-500">Notifications unsupported</span>
          )}
        </div>
      </div>

      {hasPrayerTasks ? (
        <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>Prayer reminders follow your current location.</span>
          {permission === "granted" ? (
            <button
              type="button"
              onClick={startLocationWatch}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
            >
              Enable location
            </button>
          ) : null}
        </div>
      ) : null}

      {locationError ? (
        <p className="text-xs font-semibold text-rose-500">{locationError}</p>
      ) : prayerSyncLabel ? (
        <p className="text-xs text-slate-500">Prayer times updated at {prayerSyncLabel}.</p>
      ) : null}
    </section>
  );
}
