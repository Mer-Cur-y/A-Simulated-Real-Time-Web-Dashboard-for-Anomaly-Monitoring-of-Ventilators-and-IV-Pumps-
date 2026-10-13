"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { login } from "@/services/auth/auth.service";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("กรุณากรอก Email และ Password");
      return;
    }

    try {
      setLoading(true);

      await login(
        email.trim(),
        password
      );

      router.push("/dashboard");
      router.refresh();

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("ไม่สามารถเข้าสู่ระบบได้");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      {/* Email */}
      <div className="form-control">
        <label
          htmlFor="email"
          className="label"
        >
          <span className="label-text">
            Email
          </span>
        </label>

        <input
          id="email"
          type="email"
          placeholder="example@email.com"
          className="input input-bordered w-full"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          disabled={loading}
          autoComplete="email"
        />
      </div>

      {/* Password */}
      <div className="form-control">
        <label
          htmlFor="password"
          className="label"
        >
          <span className="label-text">
            Password
          </span>
        </label>

        <input
          id="password"
          type="password"
          placeholder="Password"
          className="input input-bordered w-full"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          disabled={loading}
          autoComplete="current-password"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {/* Login button */}
      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="loading loading-spinner loading-sm" />
            กำลังเข้าสู่ระบบ...
          </>
        ) : (
          "เข้าสู่ระบบ"
        )}
      </button>
    </form>
  );
}