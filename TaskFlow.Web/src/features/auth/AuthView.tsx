import { FormEvent, useState } from "react";
import { API_BASE_URL, login, register } from "../../api";
import { getErrorMessage } from "../../shared/errors";

type AuthViewProps = {
  onAuthenticated: (token: string) => void;
  message: string;
  setMessage: (message: string) => void;
};

export function AuthView({ onAuthenticated, message, setMessage }: AuthViewProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginName, setLoginName] = useState("");
  const [email, setEmail] = useState("");
  const [nick, setNick] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      if (mode === "register") {
        await register(email, nick, password);
        const result = await login(email, password);
        onAuthenticated(result.token);
      } else {
        const result = await login(loginName, password);
        onAuthenticated(result.token);
      }
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="brand-mark">TF</div>
        <h1>TaskFlow</h1>
        <p>Plan tasks, group related work, and keep momentum visible.</p>

        <div className="segmented">
          <button
            className={mode === "login" ? "is-active" : ""}
            onClick={() => setMode("login")}
            type="button"
          >
            Sign in
          </button>
          <button
            className={mode === "register" ? "is-active" : ""}
            onClick={() => setMode("register")}
            type="button"
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="stack">
          {mode === "register" ? (
            <>
              <label>
                Email
                <input
                  autoComplete="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              <label>
                Nick
                <input
                  autoComplete="username"
                  value={nick}
                  onChange={(event) => setNick(event.target.value)}
                  required
                />
              </label>
            </>
          ) : (
            <label>
              Email or nick
              <input
                autoComplete="username"
                value={loginName}
                onChange={(event) => setLoginName(event.target.value)}
                required
              />
            </label>
          )}
          <label>
            Password
            <input
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              type="password"
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {message && <p className="notice">{message}</p>}
          <button className="primary-button" disabled={isSubmitting}>
            {isSubmitting
              ? "Working..."
              : mode === "register"
                ? "Create account"
                : "Sign in"}
          </button>
        </form>
        <p className="api-hint">API: {API_BASE_URL}</p>
      </section>
    </main>
  );
}
