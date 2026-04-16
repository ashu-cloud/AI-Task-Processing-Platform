"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
};

type Task = {
  _id: string;
  title: string;
  inputText: string;
  operation: string;
  status: "pending" | "running" | "success" | "failed";
  result?: string;
  errorMessage?: string;
  logs: Array<{ message: string; createdAt: string }>;
  createdAt: string;
  updatedAt: string;
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
});

const emptyTaskForm = {
  title: "",
  inputText: "",
  operation: "uppercase",
};

export default function Home() {
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const authHeaders = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
    [token],
  );

  useEffect(() => {
    const storedToken = window.localStorage.getItem("token");
    const storedUser = window.localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    void fetchTasks();
    const interval = window.setInterval(() => {
      void fetchTasks();
    }, 3000);

    return () => window.clearInterval(interval);
  }, [fetchTasks, token]);

  const fetchTasks = useCallback(async () => {
    try {
      const response = await api.get<{ tasks: Task[] }>("/tasks", authHeaders);
      setTasks(response.data.tasks);
    } catch (error) {
      setMessage(extractError(error, "Unable to fetch tasks."));
    }
  }, [authHeaders]);

  async function handleAuthSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const endpoint = authMode === "register" ? "/auth/register" : "/auth/login";
      const payload =
        authMode === "register"
          ? authForm
          : { email: authForm.email, password: authForm.password };
      const response = await api.post<{ token: string; user: User }>(
        endpoint,
        payload,
      );

      setToken(response.data.token);
      setUser(response.data.user);
      window.localStorage.setItem("token", response.data.token);
      window.localStorage.setItem("user", JSON.stringify(response.data.user));
      setMessage(
        authMode === "register"
          ? "Registration complete. You can create tasks now."
          : "Logged in successfully.",
      );
    } catch (error) {
      setMessage(extractError(error, "Authentication failed."));
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await api.post("/tasks", taskForm, authHeaders);
      setTaskForm(emptyTaskForm);
      setMessage("Task queued successfully.");
      await fetchTasks();
    } catch (error) {
      setMessage(extractError(error, "Unable to create task."));
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    setToken("");
    setUser(null);
    setTasks([]);
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("user");
    setMessage("Logged out.");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-950/20">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-cyan-300">
            MERN + Python Worker Assignment
          </p>
          <h1 className="text-4xl font-semibold">AI Task Processing Platform</h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            Register, log in, submit async text-processing jobs, and track task
            status, logs, and results in real time.
          </p>
          {message ? <p className="mt-4 text-sm text-emerald-300">{message}</p> : null}
        </section>

        <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">
                {user ? `Welcome, ${user.name}` : "Authentication"}
              </h2>
              {user ? (
                <button className="button-secondary" onClick={handleLogout} type="button">
                  Logout
                </button>
              ) : null}
            </div>

            {!user ? (
              <>
                <div className="mb-5 flex gap-2 rounded-full bg-slate-800 p-1">
                  <button
                    className={`toggle-button ${authMode === "register" ? "toggle-button-active" : ""}`}
                    onClick={() => setAuthMode("register")}
                    type="button"
                  >
                    Register
                  </button>
                  <button
                    className={`toggle-button ${authMode === "login" ? "toggle-button-active" : ""}`}
                    onClick={() => setAuthMode("login")}
                    type="button"
                  >
                    Login
                  </button>
                </div>

                <form className="space-y-4" onSubmit={handleAuthSubmit}>
                  {authMode === "register" ? (
                    <label className="field">
                      <span>Name</span>
                      <input
                        className="input"
                        onChange={(event) =>
                          setAuthForm((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        required
                        value={authForm.name}
                      />
                    </label>
                  ) : null}
                  <label className="field">
                    <span>Email</span>
                    <input
                      className="input"
                      onChange={(event) =>
                        setAuthForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      required
                      type="email"
                      value={authForm.email}
                    />
                  </label>
                  <label className="field">
                    <span>Password</span>
                    <input
                      className="input"
                      minLength={8}
                      onChange={(event) =>
                        setAuthForm((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                      required
                      type="password"
                      value={authForm.password}
                    />
                  </label>
                  <button className="button-primary w-full" disabled={loading} type="submit">
                    {loading ? "Please wait..." : authMode === "register" ? "Create account" : "Login"}
                  </button>
                </form>
              </>
            ) : (
              <form className="space-y-4" onSubmit={handleCreateTask}>
                <label className="field">
                  <span>Task title</span>
                  <input
                    className="input"
                    onChange={(event) =>
                      setTaskForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Convert article headline to uppercase"
                    required
                    value={taskForm.title}
                  />
                </label>
                <label className="field">
                  <span>Input text</span>
                  <textarea
                    className="input min-h-40 resize-y"
                    onChange={(event) =>
                      setTaskForm((current) => ({
                        ...current,
                        inputText: event.target.value,
                      }))
                    }
                    placeholder="Paste text to process"
                    required
                    value={taskForm.inputText}
                  />
                </label>
                <label className="field">
                  <span>Operation</span>
                  <select
                    className="input"
                    onChange={(event) =>
                      setTaskForm((current) => ({
                        ...current,
                        operation: event.target.value,
                      }))
                    }
                    value={taskForm.operation}
                  >
                    <option value="uppercase">Uppercase</option>
                    <option value="lowercase">Lowercase</option>
                    <option value="reverse">Reverse string</option>
                    <option value="word_count">Word count</option>
                  </select>
                </label>
                <button className="button-primary w-full" disabled={loading} type="submit">
                  {loading ? "Submitting..." : "Run task"}
                </button>
              </form>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Task monitor</h2>
                <p className="text-sm text-slate-400">
                  Pending and running tasks refresh automatically every 3 seconds.
                </p>
              </div>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-200">
                {tasks.length} tasks
              </span>
            </div>

            <div className="grid gap-4">
              {tasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-400">
                  No tasks yet. Log in and queue your first job.
                </div>
              ) : (
                tasks.map((task) => (
                  <article
                    className="rounded-2xl border border-white/10 bg-slate-950/70 p-5"
                    key={task._id}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-semibold">{task.title}</h3>
                        <p className="text-sm text-slate-400">
                          Operation: {task.operation.replace("_", " ")}
                        </p>
                      </div>
                      <span className={`status-pill status-${task.status}`}>
                        {task.status}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <div>
                        <h4 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Input
                        </h4>
                        <pre className="content-box">{task.inputText}</pre>
                      </div>
                      <div>
                        <h4 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Result
                        </h4>
                        <pre className="content-box">
                          {task.result || task.errorMessage || "Waiting for worker output..."}
                        </pre>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Logs
                      </h4>
                      <ul className="space-y-2 text-sm text-slate-300">
                        {task.logs.map((log, index) => (
                          <li className="rounded-xl bg-white/5 px-3 py-2" key={`${task._id}-${index}`}>
                            {log.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function extractError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { message?: string } | undefined)?.message || fallback;
  }

  return fallback;
}
