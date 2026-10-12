
"use client";

import { useEffect, useState } from "react";
import {
  createManagedUser,
  getUsers,
  updateUserRole,
  type SystemUser,
  type UserRole,
} from "@/services/users/user.service";

const roles: UserRole[] = ["admin", "doctor", "nurse", "staff"];

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 disabled:bg-slate-100";

export default function UserManagement() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingUid, setSavingUid] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
    role: "staff" as Exclude<UserRole, "admin">,
  });

  async function loadUsers() {
    try {
      setLoading(true);
      setError(null);

      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ไม่สามารถโหลดข้อมูลผู้ใช้ได้",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleCreateUser(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (form.password.length < 8) {
      setError("Password ต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Password และ Confirm Password ไม่ตรงกัน");
      return;
    }

    try {
      setCreating(true);

      await createManagedUser({
        email: form.email.trim(),
        password: form.password,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        role: form.role,
      });

      setForm({
        email: "",
        password: "",
        confirmPassword: "",
        first_name: "",
        last_name: "",
        role: "staff",
      });

      setShowCreateForm(false);
      await loadUsers();
      setMessage("สร้างบัญชีผู้ใช้เรียบร้อยแล้ว");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ไม่สามารถสร้างบัญชีได้",
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleRoleChange(
    uid: string,
    role: UserRole,
  ) {
    try {
      setSavingUid(uid);
      setError(null);
      setMessage(null);

      await updateUserRole(uid, role);

      setUsers((current) =>
        current.map((user) =>
          user.uid === uid ? { ...user, role } : user,
        ),
      );

      setMessage("เปลี่ยน Role เรียบร้อยแล้ว");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ไม่สามารถเปลี่ยน Role ได้",
      );
    } finally {
      setSavingUid(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <span className="loading loading-spinner loading-md text-emerald-600" />
        <p className="mt-3 text-sm font-medium text-slate-700">
          กำลังโหลดข้อมูลผู้ใช้...
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-6 bg-slate-50 text-slate-900">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            User Management
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            จัดการบัญชีผู้ใช้งานและสิทธิ์การเข้าถึงระบบ
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowCreateForm((current) => !current);
            setError(null);
            setMessage(null);
          }}
          className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
        >
          {showCreateForm ? "ยกเลิก" : "+ เพิ่มผู้ใช้"}
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          {message}
        </div>
      )}

      {/* Create user form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateUser}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              สร้างบัญชีเจ้าหน้าที่
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Admin กำหนดข้อมูลเข้าสู่ระบบให้เจ้าหน้าที่
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="off"
                placeholder="staff@hospital.com"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Role
              </label>
              <select
                value={form.role}
                onChange={(e) =>
                  setForm({
                    ...form,
                    role: e.target.value as Exclude<UserRole, "admin">,
                  })
                }
                className={inputClass}
              >
                <option value="doctor">Doctor</option>
                <option value="nurse">Nurse</option>
                <option value="staff">Staff</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                ชื่อ
              </label>
              <input
                type="text"
                required
                placeholder="กรอกชื่อ"
                value={form.first_name}
                onChange={(e) =>
                  setForm({ ...form, first_name: e.target.value })
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                นามสกุล
              </label>
              <input
                type="text"
                required
                placeholder="กรอกนามสกุล"
                value={form.last_name}
                onChange={(e) =>
                  setForm({ ...form, last_name: e.target.value })
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="อย่างน้อย 8 ตัวอักษร"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Confirm Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="กรอก Password อีกครั้ง"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm({
                    ...form,
                    confirmPassword: e.target.value,
                  })
                }
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={creating}
              className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? "กำลังสร้างบัญชี..." : "สร้างบัญชี"}
            </button>
          </div>
        </form>
      )}

      {/* User table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-bold text-slate-900">
              รายชื่อผู้ใช้งาน
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              ทั้งหมด {users.length} บัญชี
            </p>
          </div>

          <button
            type="button"
            onClick={loadUsers}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
          >
            รีเฟรช
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-5 py-4 font-bold text-slate-800 sm:px-6">
                  ผู้ใช้งาน
                </th>
                <th className="px-5 py-4 font-bold text-slate-800">
                  Role
                </th>
                <th className="px-5 py-4 font-bold text-slate-800">
                  วันที่สร้าง
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {users.map((user) => (
                <tr
                  key={user.uid}
                  className="transition hover:bg-slate-50"
                >
                  <td className="px-5 py-4 sm:px-6">
                    <p className="font-semibold text-slate-900">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="mt-1 break-all text-xs text-slate-600">
                      UID: {user.uid}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <select
                      value={user.role}
                      disabled={savingUid === user.uid}
                      onChange={(event) =>
                        handleRoleChange(
                          user.uid,
                          event.target.value as UserRole,
                        )
                      }
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 disabled:opacity-50"
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>

                    {savingUid === user.uid && (
                      <span className="ml-2 text-xs text-slate-600">
                        กำลังบันทึก...
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-slate-700">
                    {new Date(user.created_at).toLocaleString("th-TH")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="p-10 text-center">
            <p className="font-medium text-slate-800">
              ไม่พบผู้ใช้งาน
            </p>
            <p className="mt-1 text-sm text-slate-600">
              ลองรีเฟรชข้อมูลหรือตรวจสอบสิทธิ์การเข้าถึง
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
