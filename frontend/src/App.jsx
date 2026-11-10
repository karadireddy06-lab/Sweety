
import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API = "http://127.0.0.1:5000/api";

const SLOTS = [
  { value: "morning_fasting", label: "Morning (fasting)" },
  { value: "after_breakfast", label: "After breakfast" },
  { value: "after_lunch", label: "After lunch" },
  { value: "after_dinner", label: "After dinner" },
];

function getToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = {};
  parts.forEach((part) => {
    values[part.type] = part.value;
  });

  return `${values.year}-${values.month}-${values.day}`;
}

function normaliseDate(value) {
  if (!value) return "";

  const text = String(value);

  // Old PostgreSQL date responses may appear as UTC timestamps.
  if (text.includes("T")) {
    const date = new Date(text);

    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date);
    }
  }

  return text.slice(0, 10);
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(`${value}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStats(items) {
  if (!items.length) {
    return { count: 0, highest: null, lowest: null, average: null };
  }

  const values = items.map((item) => Number(item.value));
  const total = values.reduce((sum, value) => sum + value, 0);

  return {
    count: values.length,
    highest: Math.max(...values),
    lowest: Math.min(...values),
    average: Number((total / values.length).toFixed(1)),
  };
}

function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem("sweety_token") || ""
  );
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sweety_user")) || null;
    } catch {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [readings, setReadings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [readingForm, setReadingForm] = useState({
    reading_date: getToday(),
    slot: "morning_fasting",
    value: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function apiRequest(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  }

  async function loadReadings() {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/readings");

      const formatted = (data.readings || []).map((reading) => ({
        ...reading,
        reading_date: normaliseDate(reading.reading_date),
      }));

      setReadings(formatted);
    } catch (err) {
      setError(err.message);

      if (err.message.toLowerCase().includes("token")) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadReadings();
    }
    // Load after authentication changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleAuth(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    try {
      const endpoint =
        authMode === "register" ? "/auth/register" : "/auth/login";

      const body =
        authMode === "register"
          ? authForm
          : {
              email: authForm.email,
              password: authForm.password,
            };

      const data = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (data.token) {
        localStorage.setItem("sweety_token", data.token);
        setToken(data.token);

        if (data.user) {
          localStorage.setItem("sweety_user", JSON.stringify(data.user));
          setUser(data.user);
        }

        setNotice(
          authMode === "register"
            ? "Your account was created successfully."
            : "Welcome back!"
        );
      } else if (authMode === "register") {
        setAuthMode("login");
        setNotice("Registration successful. Please log in.");
      } else {
        throw new Error("Login response did not contain an authentication token.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("sweety_token");
    localStorage.removeItem("sweety_user");
    setToken("");
    setUser(null);
    setReadings([]);
    setEditingId(null);
    setError("");
    setNotice("");
  }

  function updateReadingField(event) {
    const { name, value } = event.target;

    setReadingForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function startEdit(reading) {
    setEditingId(reading.id);

    setReadingForm({
      reading_date: normaliseDate(reading.reading_date),
      slot: reading.slot,
      value: String(reading.value),
    });

    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setReadingForm({
      reading_date: getToday(),
      slot: "morning_fasting",
      value: "",
    });
    setError("");
  }

  async function handleReadingSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    const date = readingForm.reading_date;
    const value = Number(readingForm.value);

    if (!date) {
      setError("Please select a reading date.");
      return;
    }

    if (date > getToday()) {
      setError("Date cannot be in the future.");
      return;
    }

    if (
      readingForm.value === "" ||
      !Number.isInteger(value) ||
      value < 40 ||
      value > 600
    ) {
      setError("Value must be between 40 and 600 mg/dl.");
      return;
    }

    const sameDate = readings.filter(
      (reading) =>
        reading.reading_date === date &&
        String(reading.id) !== String(editingId)
    );

    const duplicateSlot = sameDate.some(
      (reading) => reading.slot === readingForm.slot
    );

    if (duplicateSlot) {
      const slotName =
        SLOTS.find((slot) => slot.value === readingForm.slot)?.label ||
        readingForm.slot;

      setError(`You already have an ${slotName} reading for this date.`);
      return;
    }

    if (!editingId && sameDate.length >= 4) {
      setError("You can add only 4 readings per day.");
      return;
    }

    setSaving(true);

    try {
      const body = {
        reading_date: date,
        slot: readingForm.slot,
        value,
      };

      const data = await apiRequest(
        editingId ? `/readings/${editingId}` : "/readings",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify(body),
        }
      );

      setNotice(data.message || "Reading saved successfully.");

      setReadingForm({
        reading_date: getToday(),
        slot: "morning_fasting",
        value: "",
      });

      setEditingId(null);
      await loadReadings();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this reading?"
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      const data = await apiRequest(`/readings/${id}`, {
        method: "DELETE",
      });

      setNotice(data.message || "Reading deleted successfully.");

      if (String(editingId) === String(id)) {
        cancelEdit();
      }

      await loadReadings();
    } catch (err) {
      setError(err.message);
    }
  }

  const dailyReadings = useMemo(
    () =>
      readings
        .filter((reading) => reading.reading_date === selectedDate)
        .sort(
          (a, b) =>
            SLOTS.findIndex((slot) => slot.value === a.slot) -
            SLOTS.findIndex((slot) => slot.value === b.slot)
        ),
    [readings, selectedDate]
  );

  const monthToDateReadings = useMemo(
    () =>
      readings.filter(
        (reading) =>
          reading.reading_date >= `${selectedDate.slice(0, 7)}-01` &&
          reading.reading_date <= selectedDate
      ),
    [readings, selectedDate]
  );

  const previousMonthReadings = useMemo(() => {
    const date = new Date(`${selectedDate}T00:00:00`);
    const firstDay = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth(), 0);

    const toISO = (value) => {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, "0");
      const day = String(value.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const start = toISO(firstDay);
    const end = toISO(lastDay);

    return readings.filter(
      (reading) =>
        reading.reading_date >= start && reading.reading_date <= end
    );
  }, [readings, selectedDate]);

  if (!token) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <div className="brand-mark">S</div>
          <p className="eyebrow">YOUR PERSONAL HEALTH COMPANION</p>
          <h1>Welcome to Sweety</h1>
          <p className="muted">
            Track your blood glucose readings and understand your daily trends.
          </p>

          <div className="auth-tabs">
            <button
              className={authMode === "login" ? "active" : ""}
              onClick={() => {
                setAuthMode("login");
                setError("");
                setNotice("");
              }}
              type="button"
            >
              Log in
            </button>
            <button
              className={authMode === "register" ? "active" : ""}
              onClick={() => {
                setAuthMode("register");
                setError("");
                setNotice("");
              }}
              type="button"
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleAuth} className="form-stack">
            {authMode === "register" && (
              <label>
                Full name
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={authForm.name}
                  onChange={(event) =>
                    setAuthForm({ ...authForm, name: event.target.value })
                  }
                  required
                />
              </label>
            )}

            <label>
              Email address
              <input
                type="email"
                placeholder="you@example.com"
                value={authForm.email}
                onChange={(event) =>
                  setAuthForm({ ...authForm, email: event.target.value })
                }
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                placeholder="At least 8 characters"
                value={authForm.password}
                onChange={(event) =>
                  setAuthForm({ ...authForm, password: event.target.value })
                }
                minLength={8}
                required
              />
            </label>

            {error && <p className="alert error">{error}</p>}
            {notice && <p className="alert success">{notice}</p>}

            <button className="primary-button full-width" disabled={loading}>
              {loading
                ? "Please wait..."
                : authMode === "register"
                  ? "Create account"
                  : "Log in to Sweety"}
            </button>
          </form>

          <p className="auth-footer">
            Your health data is private and linked to your account.
          </p>
        </section>
      </main>
    );
  }

  const dailyStats = getStats(dailyReadings);
  const mtdStats = getStats(monthToDateReadings);
  const previousStats = getStats(previousMonthReadings);

  const displayName = user?.name || user?.email || "there";

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#dashboard">
          <span className="brand-mark small">S</span>
          <span>Sweety</span>
        </a>

        <div className="topbar-right">
          <span className="welcome-user">Hi, {displayName}</span>
          <button className="logout-button" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <section className="dashboard" id="dashboard">
        <div className="welcome-section">
          <div>
            <p className="eyebrow">YOUR HEALTH OVERVIEW</p>
            <h1>Glucose dashboard</h1>
            <p className="muted">
              Keep track of your readings, one day at a time.
            </p>
          </div>

          <div className="date-picker-card">
            <label htmlFor="report-date">Report date</label>
            <input
              id="report-date"
              type="date"
              max={getToday()}
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </div>
        </div>

        {error && <p className="alert error">{error}</p>}
        {notice && <p className="alert success">{notice}</p>}

        <section className="content-grid">
          <div className="panel form-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">
                  {editingId ? "EDIT ENTRY" : "NEW ENTRY"}
                </p>
                <h2>{editingId ? "Update reading" : "Add a reading"}</h2>
              </div>
              <span className="panel-icon">＋</span>
            </div>

            <form onSubmit={handleReadingSubmit} className="form-stack">
              <label>
                Reading date
                <input
                  type="date"
                  name="reading_date"
                  max={getToday()}
                  value={readingForm.reading_date}
                  onChange={updateReadingField}
                  required
                />
              </label>

              <label>
                Time slot
                <select
                  name="slot"
                  value={readingForm.slot}
                  onChange={updateReadingField}
                >
                  {SLOTS.map((slot) => (
                    <option value={slot.value} key={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Glucose value (mg/dl)
                <div className="value-input">
                  <input
                    type="number"
                    name="value"
                    min="40"
                    max="600"
                    step="1"
                    placeholder="e.g. 110"
                    value={readingForm.value}
                    onChange={updateReadingField}
                    required
                  />
                  <span>mg/dl</span>
                </div>
              </label>

              <button
                className="primary-button full-width"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save changes"
                    : "Add reading"}
              </button>

              {editingId && (
                <button
                  className="secondary-button full-width"
                  type="button"
                  onClick={cancelEdit}
                >
                  Cancel editing
                </button>
              )}
            </form>
          </div>

          <div className="report-column">
            <div className="section-heading">
              <div>
                <p className="eyebrow">AT A GLANCE</p>
                <h2>Reading reports</h2>
              </div>
            </div>

            <div className="stats-grid">
              <StatCard
                title="Daily"
                subtitle={formatDate(selectedDate)}
                stats={dailyStats}
              />
              <StatCard
                title="Month to date"
                subtitle={`${selectedDate.slice(0, 7)}`}
                stats={mtdStats}
              />
              <StatCard
                title="Previous month"
                subtitle="Full month"
                stats={previousStats}
              />
            </div>

            <div className="panel daily-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">DAILY DETAIL</p>
                  <h2>{formatDate(selectedDate)}</h2>
                </div>
                <span className="reading-count">
                  {dailyReadings.length}/4 readings
                </span>
              </div>

              {loading ? (
                <p className="empty-state">Loading readings...</p>
              ) : dailyReadings.length === 0 ? (
                <p className="empty-state">
                  No readings for this date yet. Add your first reading to get
                  started.
                </p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Time slot</th>
                        <th>Value</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyReadings.map((reading) => (
                        <tr key={reading.id}>
                          <td>
                            {SLOTS.find(
                              (slot) => slot.value === reading.slot
                            )?.label || reading.slot}
                          </td>
                          <td className="value-cell">
                            {reading.value} <small>mg/dl</small>
                          </td>
                          <td>
                            <div className="row-actions">
                              <button
                                className="text-button"
                                onClick={() => startEdit(reading)}
                              >
                                Edit
                              </button>
                              <button
                                className="text-button delete-text"
                                onClick={() => handleDelete(reading.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="panel history-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">YOUR RECORDS</p>
              <h2>All reading history</h2>
            </div>
            <button className="secondary-button" onClick={loadReadings}>
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="empty-state">Loading history...</p>
          ) : readings.length === 0 ? (
            <p className="empty-state">
              Your reading history is empty. Add a reading to see it here.
            </p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time slot</th>
                    <th>Glucose value</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {readings.map((reading) => (
                    <tr key={reading.id}>
                      <td>{formatDate(reading.reading_date)}</td>
                      <td>
                        {SLOTS.find(
                          (slot) => slot.value === reading.slot
                        )?.label || reading.slot}
                      </td>
                      <td className="value-cell">
                        {reading.value} <small>mg/dl</small>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="text-button"
                            onClick={() => startEdit(reading)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-button delete-text"
                            onClick={() => handleDelete(reading.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="app-footer">
          Sweety · Blood Glucose Tracker · Your readings, organised.
        </footer>
      </section>
    </main>
  );
}

function StatCard({ title, subtitle, stats }) {
  return (
    <article className="stat-card">
      <p className="stat-title">{title}</p>
      <p className="stat-subtitle">{subtitle}</p>

      {stats.count === 0 ? (
        <p className="stat-empty">No readings</p>
      ) : (
        <>
          <div className="stat-average">
            {stats.average}
            <small>mg/dl average</small>
          </div>

          <div className="stat-details">
            <span>
              Highest <strong>{stats.highest}</strong>
            </span>
            <span>
              Lowest <strong>{stats.lowest}</strong>
            </span>
            <span>
              Count <strong>{stats.count}</strong>
            </span>
          </div>
        </>
      )}
    </article>
  );
}

export default App;
