import React, { useReducer, useState, useRef } from "react";

const initial = [
  { id: 1, name: "Alice Johnson", status: "Unmarked" },
  { id: 2, name: "Bob Martinez", status: "Unmarked" },
  { id: 3, name: "Carla Singh", status: "Unmarked" },
  { id: 4, name: "Daniel Kim", status: "Unmarked" },
  { id: 5, name: "Eve Zhao", status: "Unmarked" }
];

function reducer(state, action) {
  switch (action.type) {
    case "ADD":
      return [...state, action.payload];
    case "REMOVE":
      return state.filter(s => s.id !== action.payload);
    case "MARK":
      return state.map(s => (s.id === action.payload.id ? { ...s, status: action.payload.status } : s));
    case "TOGGLE":
      return state.map(s => (s.id === action.payload ? { ...s, status: s.status === "Present" ? "Absent" : "Present" } : s));
    case "MARK_ALL":
      return state.map(s => ({ ...s, status: action.payload }));
    case "RESET":
      return state.map(s => ({ ...s, status: "Unmarked" }));
    case "REPLACE":
      return action.payload;
    default:
      return state;
  }
}

export default function App() {
  const [students, dispatch] = useReducer(reducer, initial);
  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const nextId = useRef(6);
  const pasteRef = useRef();

  function addStudent(e) {
    e && e.preventDefault();
    const v = name.trim();
    if (!v) return;
    dispatch({ type: "ADD", payload: { id: nextId.current++, name: v, status: "Unmarked" } });
    setName("");
  }

  function exportCSV() {
    const rows = ["Id,Name,Status", ...students.map(s => `${s.id},"${s.name.replace(/"/g,'""')}",${s.status}`)];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "attendance.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importCSV() {
    const text = pasteRef.current?.value || "";
    if (!text.trim()) return alert("Paste CSV text first");
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const parsed = [];
    for (const line of lines) {
      const parts = line.split(",").map(p => p.replace(/^\s*"|"\s*$/g, "").trim());
      if (parts.length === 3 && !isNaN(Number(parts[0]))) {
        parsed.push({ id: Number(parts[0]), name: parts[1], status: parts[2] || "Unmarked" });
      } else if (parts.length >= 2) {
        parsed.push({ id: nextId.current++, name: parts[0], status: parts[1] || "Unmarked" });
      }
    }
    if (parsed.length) dispatch({ type: "REPLACE", payload: parsed });
    if (pasteRef.current) pasteRef.current.value = "";
  }

  const filtered = students.filter(s => s.name.toLowerCase().includes(q.toLowerCase()) || String(s.id).includes(q));

  const counts = {
    total: students.length,
    present: students.filter(s => s.status === "Present").length,
    absent: students.filter(s => s.status === "Absent").length,
    unmarked: students.filter(s => s.status === "Unmarked").length
  };

  return (
    <div className="wrap">
      <header className="top">
        <div>
          <h1>Classroom Attendance</h1>
          <p className="muted">Mark students present or absent, export/import CSV.</p>
        </div>
        <div className="info">
          <div>{counts.total} students</div>
          <div className="muted">P:{counts.present} • A:{counts.absent}</div>
        </div>
      </header>

      <section className="controls card">
        <div className="row">
          <input placeholder="Search by name or id" value={q} onChange={e => setQ(e.target.value)} />
          <button className="btn" onClick={() => dispatch({ type: "MARK_ALL", payload: "Present" })}>All Present</button>
          <button className="btn" onClick={() => dispatch({ type: "MARK_ALL", payload: "Absent" })}>All Absent</button>
          <button className="btn danger" onClick={() => dispatch({ type: "RESET" })}>Reset</button>
          <button className="btn primary" onClick={exportCSV}>Export CSV</button>
        </div>

        <form className="row" onSubmit={addStudent}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="New student name" />
          <button className="btn add" type="submit">Add</button>
          <textarea ref={pasteRef} className="paste" placeholder="Paste CSV (id,name,status or name,status)"></textarea>
          <div className="row">
            <button className="btn" type="button" onClick={importCSV}>Import (replace)</button>
            <button className="btn" onClick={() => { if (pasteRef.current) pasteRef.current.value = ""; }}>Clear</button>
          </div>
        </form>
      </section>

      <section className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Student</th>
              <th>Status</th>
              <th className="right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td className="name">{s.name}</td>
                <td>
                  <span className={`badge ${s.status === "Present" ? "present" : s.status === "Absent" ? "absent" : "unmarked"}`}>{s.status}</span>
                </td>
                <td className="right actions">
                  <button className="btn" onClick={() => dispatch({ type: "MARK", payload: { id: s.id, status: "Present" } })}>Present</button>
                  <button className="btn" onClick={() => dispatch({ type: "MARK", payload: { id: s.id, status: "Absent" } })}>Absent</button>
                  <button className="btn danger" onClick={() => dispatch({ type: "REMOVE", payload: s.id })}>Remove</button>
                  <button className="btn" onClick={() => dispatch({ type: "TOGGLE", payload: s.id })}>Toggle</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="4" className="muted">No results</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <footer className="card summary">
        <div>
          <strong>Summary</strong>
          <div className="muted">Present: {counts.present} • Absent: {counts.absent} • Unmarked: {counts.unmarked}</div>
        </div>
        <div className="right muted">Made with React + Vite</div>
      </footer>
    </div>
  );
}
