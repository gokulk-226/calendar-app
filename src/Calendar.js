import React, { useState, useEffect } from "react";
import dayjs from "dayjs";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ title: "", date: "", time: "", duration: "" });

  // Load events
  useEffect(() => {
    const savedEvents = localStorage.getItem("calendar-events");
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    } else {
      fetch("/events.json")
        .then((res) => res.json())
        .then(setEvents)
        .catch(() => console.warn("No static events loaded."));
    }
  }, []);

  const startDate = currentMonth.startOf("month").startOf("week");
  const endDate = currentMonth.endOf("month").endOf("week");

  const calendarDays = [];
  let day = startDate;
  while (day.isBefore(endDate, "day") || day.isSame(endDate, "day")) {
    calendarDays.push(day);
    day = day.add(1, "day");
  }

  const isToday = (d) => d.isSame(dayjs(), "day");
  const isSameMonth = (d) => d.month() === currentMonth.month();
  const getEventsForDate = (date) => events.filter((e) => dayjs(e.date).isSame(date, "day"));

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (form.title && form.date && form.time) {
      const updatedEvents = [...events, form];
      setEvents(updatedEvents);
      localStorage.setItem("calendar-events", JSON.stringify(updatedEvents));
      setForm({ title: "", date: "", time: "", duration: "" });
    }
  };

  const hasConflict = (event, list) =>
    list.filter((e) => e.date === event.date && e.time === event.time).length > 1;

  const exportEvents = () => {
    const blob = new Blob([JSON.stringify(events, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "calendar-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearEvents = () => {
    localStorage.removeItem("calendar-events");
    setEvents([]);
  };

  return (
    <div className="calendar-wrapper">
      {/* Header */}
      <div className="calendar-header">
        <button onClick={() => setCurrentMonth(currentMonth.subtract(1, "month"))}>←</button>
        <h2>{currentMonth.format("MMMM YYYY")}</h2>
        <button onClick={() => setCurrentMonth(currentMonth.add(1, "month"))}>→</button>
      </div>

      {/* Event Form */}
      <form onSubmit={handleAddEvent} className="event-form">
        <input type="text" name="title" placeholder="Event Title" value={form.title} onChange={handleFormChange} required />
        <input type="date" name="date" value={form.date} onChange={handleFormChange} required />
        <input type="time" name="time" value={form.time} onChange={handleFormChange} required />
        <input type="text" name="duration" placeholder="Duration (e.g. 1h)" value={form.duration} onChange={handleFormChange} />
        <button type="submit">Add Event</button>
      </form>

      {/* Controls */}
      <div className="button-group">
        <button onClick={exportEvents}>Export Events</button>
        <button onClick={clearEvents} className="clear">Clear All</button>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {days.map((d) => (
          <div className="day header" key={d}>{d}</div>
        ))}
        {calendarDays.map((date, idx) => {
          const dailyEvents = getEventsForDate(date);
          return (
            <div
              key={idx}
              className={`day ${isToday(date) ? "today" : ""} ${!isSameMonth(date) ? "faded" : ""}`}
            >
              <div className="date-number">{date.date()}</div>
              <div className="event-container">
                {dailyEvents.map((ev, i) => {
                  const conflict = hasConflict(ev, dailyEvents);
                  return (
                    <div
                      key={i}
                      className={`event ${conflict ? "conflict" : ""}`}
                      title={conflict ? "Conflict!" : ev.title}
                    >
                      {ev.title} @ {ev.time}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Calendar;
