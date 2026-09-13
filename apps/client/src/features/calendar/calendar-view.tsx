"use client";

import { useState, useMemo } from "react";
import { CalendarEvent } from "./calendar-types";
import { CalendarNavBar } from "./calendar-nav-bar";
import { CalendarMonthGrid } from "./calendar-month-grid";
import { CalendarEventDialog } from "./calendar-event-dialog";

interface CalendarViewProps {
  initialEvents: CalendarEvent[];
  userId?: string;
}

export function CalendarView({ initialEvents }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedTimezone, setSelectedTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  });
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString("default", { month: "long" });

  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const days = [];

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
      });
    }

    for (let day = 1; day <= totalDaysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true,
      });
    }

    const remaining = 42 - days.length;
    for (let day = 1; day <= remaining; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const evt of initialEvents) {
      try {
        const d = new Date(evt.startAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const list = map.get(key) || [];
        list.push(evt);
        map.set(key, list);
      } catch {}
    }
    return map;
  }, [initialEvents]);

  return (
    <div className="space-y-6">
      <CalendarNavBar
        monthName={monthName}
        year={year}
        selectedTimezone={selectedTimezone}
        onTimezoneChange={setSelectedTimezone}
        onPrevMonth={handlePrevMonth}
        onToday={handleToday}
        onNextMonth={handleNextMonth}
      />

      <CalendarMonthGrid
        calendarDays={calendarDays}
        eventsByDate={eventsByDate}
        onSelectEvent={setSelectedEvent}
      />

      {selectedEvent && (
        <CalendarEventDialog
          event={selectedEvent}
          selectedTimezone={selectedTimezone}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
