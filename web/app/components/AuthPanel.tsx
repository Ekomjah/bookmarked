"use client";

import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { login, register } from "@/lib/api";
import { AuthState } from "@/lib/types";

interface AuthPanelProps {
  auth: AuthState | null;
  onSignIn: (auth: AuthState) => void;
  onSignOut: () => void;
}

type Mode = "login" | "register";

interface FieldErrors {
  displayName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateDisplayName(value: string): string | undefined {
  if (!value.trim()) return "Display name is required";
  return undefined;
}

function validateEmail(value: string): string | undefined {
  const email = value.trim();
  if (!email) return "Email is required";
  if (!EMAIL_PATTERN.test(email)) return "Enter a valid email address";
  return undefined;
}

export default function AuthPanel({
  auth,
  onSignIn,
  onSignOut,
}: AuthPanelProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (auth) {
    return (
      <div className="auth-panel">
        <span>
          Signed in as <strong>{auth.user.displayName}</strong>
        </span>
        <button type="button" onClick={onSignOut}>
          Sign out
        </button>
      </div>
    );
  }

  function validatePassword(value: string): string | undefined {
    if (!value) return "Password is required";
    if (value.length < 8) return "Password must be at least 8 characters";
    return undefined;
  }

  function validateConfirmPassword(value: string): string | undefined {
    if (!value) return "Please confirm your password";
    if (value !== password) return "Passwords do not match";
    return undefined;
  }

  function validateAll(): FieldErrors {
    const errors: FieldErrors = {};

    if (mode === "register") {
      const displayNameError = validateDisplayName(displayName);
      if (displayNameError) errors.displayName = displayNameError;
    }

    const emailError = validateEmail(email);
    if (emailError) errors.email = emailError;

    if (mode === "register") {
      const passwordError = validatePassword(password);
      if (passwordError) errors.password = passwordError;
      const confirmError = validateConfirmPassword(confirmPassword);
      if (confirmError) errors.confirmPassword = confirmError;
    } else if (!password) {
      errors.password = "Password is required";
    }

    return errors;
  }

  function handleBlur(field: keyof FieldErrors) {
    let next: string | undefined;

    if (field === "displayName") {
      next = mode === "register" ? validateDisplayName(displayName) : undefined;
    } else if (field === "email") {
      next = validateEmail(email);
    } else if (field === "password") {
      next =
        mode === "register"
          ? validatePassword(password)
          : password
            ? undefined
            : "Password is required";
    } else if (field === "confirmPassword") {
      next = validateConfirmPassword(confirmPassword);
    }

    setFieldErrors((prev) => ({ ...prev, [field]: next }));
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setFieldErrors({});
    setConfirmPassword("");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const errors = validateAll();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const result =
        mode === "login"
          ? await login({ email: email.trim(), password })
          : await register({
              email: email.trim(),
              password,
              displayName: displayName.trim(),
            });
      onSignIn(result);
      setEmail("");
      setPassword("");
      setDisplayName("");
      setConfirmPassword("");
      setFieldErrors({});
      setShowPassword(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-panel" onSubmit={handleSubmit} noValidate>
      <div className="auth-tabs">
        <button
          type="button"
          className={mode === "login" ? "active" : ""}
          onClick={() => switchMode("login")}
        >
          Log in
        </button>
        <button
          type="button"
          className={mode === "register" ? "active" : ""}
          onClick={() => switchMode("register")}
        >
          Register
        </button>
      </div>

      {mode === "register" ? (
        <>
          <div className="auth-row">
            <div className="auth-col">
              <input
                type="text"
                id="auth-display-name"
                placeholder="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onBlur={() => handleBlur("displayName")}
                aria-invalid={fieldErrors.displayName ? true : undefined}
                aria-describedby={
                  fieldErrors.displayName
                    ? "auth-display-name-error"
                    : undefined
                }
                required
              />
              {fieldErrors.displayName && (
                <p className="error" id="auth-display-name-error">
                  {fieldErrors.displayName}
                </p>
              )}
            </div>
            <div className="auth-col">
              <input
                type="email"
                id="auth-email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur("email")}
                aria-invalid={fieldErrors.email ? true : undefined}
                aria-describedby={
                  fieldErrors.email ? "auth-email-error" : undefined
                }
                required
              />
              {fieldErrors.email && (
                <p className="error" id="auth-email-error">
                  {fieldErrors.email}
                </p>
              )}
            </div>
          </div>
          <div className="auth-row">
            <div className="auth-col">
              <div className="auth-field">
                <input
                  type={showPassword ? "text" : "password"}
                  id="auth-password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur("password")}
                  aria-invalid={fieldErrors.password ? true : undefined}
                  aria-describedby={
                    fieldErrors.password ? "auth-password-error" : undefined
                  }
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff size={16} strokeWidth={2} aria-hidden="true" />
                  ) : (
                    <Eye size={16} strokeWidth={2} aria-hidden="true" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="error" id="auth-password-error">
                  {fieldErrors.password}
                </p>
              )}
            </div>
            <div className="auth-col">
              <div className="auth-field">
                <input
                  type={showPassword ? "text" : "password"}
                  id="auth-confirm-password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => handleBlur("confirmPassword")}
                  aria-invalid={fieldErrors.confirmPassword ? true : undefined}
                  aria-describedby={
                    fieldErrors.confirmPassword
                      ? "auth-confirm-password-error"
                      : undefined
                  }
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff size={16} strokeWidth={2} aria-hidden="true" />
                  ) : (
                    <Eye size={16} strokeWidth={2} aria-hidden="true" />
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="error" id="auth-confirm-password-error">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <input
            type="email"
            id="auth-email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => handleBlur("email")}
            aria-invalid={fieldErrors.email ? true : undefined}
            aria-describedby={
              fieldErrors.email ? "auth-email-error" : undefined
            }
            required
          />
          {fieldErrors.email && (
            <p className="error" id="auth-email-error">
              {fieldErrors.email}
            </p>
          )}
          <div className="auth-field">
            <input
              type={showPassword ? "text" : "password"}
              id="auth-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => handleBlur("password")}
              aria-invalid={fieldErrors.password ? true : undefined}
              aria-describedby={
                fieldErrors.password ? "auth-password-error" : undefined
              }
              required
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOff size={16} strokeWidth={2} aria-hidden="true" />
              ) : (
                <Eye size={16} strokeWidth={2} aria-hidden="true" />
              )}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="error" id="auth-password-error">
              {fieldErrors.password}
            </p>
          )}
        </>
      )}
      <button type="submit" className="auth-submit" disabled={loading}>
        {loading
          ? "Please wait..."
          : mode === "login"
            ? "Log in"
            : "Create account"}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
