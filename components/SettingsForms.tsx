"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const inputClass =
  "block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const buttonClass =
  "cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

function Feedback({
  error,
  success,
}: {
  error: string | null;
  success: string | null;
}) {
  if (error) {
    return (
      <p className="text-sm text-red-600 mt-3" role="alert">
        {error}
      </p>
    );
  }
  if (success) {
    return (
      <p className="text-sm text-green-600 mt-3" role="status">
        {success}
      </p>
    );
  }
  return null;
}

export function ProfileForm({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error || "Something went wrong");
        return;
      }
      setSuccess("Profile updated");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <label
            htmlFor="settings-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Name
          </label>
          <input
            id="settings-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Email
          </label>
          <p className="text-gray-900">{email}</p>
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <button type="submit" disabled={saving} className={buttonClass}>
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>
      <Feedback error={error} success={success} />
    </form>
  );
}

export function CheckInDayForm({ initialDay }: { initialDay: number }) {
  const router = useRouter();
  const [day, setDay] = useState(initialDay);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkInDay: day }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error || "Something went wrong");
        return;
      }
      setSuccess(`Check-in day set to ${DAY_NAMES[day]}`);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label
        htmlFor="settings-check-in-day"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Weekly check-in day
      </label>
      <p className="text-sm text-gray-500 mb-2">
        The dashboard nudges you to check in on this day each week.
      </p>
      <select
        id="settings-check-in-day"
        value={day}
        onChange={(e) => setDay(parseInt(e.target.value))}
        className={inputClass}
      >
        {DAY_NAMES.map((dayName, index) => (
          <option key={dayName} value={index}>
            {dayName}
          </option>
        ))}
      </select>
      <div className="flex justify-end mt-4">
        <button type="submit" disabled={saving} className={buttonClass}>
          {saving ? "Saving..." : "Save Preference"}
        </button>
      </div>
      <Feedback error={error} success={success} />
    </form>
  );
}

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!hasPassword) {
    return (
      <p className="text-sm text-gray-500">
        This account signs in with Google, so there&apos;s no password to manage
        here.
      </p>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error || "Something went wrong");
        return;
      }
      setSuccess("Password updated");
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <label
            htmlFor="settings-current-password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Current password
          </label>
          <input
            id="settings-current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="settings-new-password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            New password
          </label>
          <input
            id="settings-new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            className={inputClass}
          />
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <button
          type="submit"
          disabled={saving || !currentPassword || !newPassword}
          className={buttonClass}
        >
          {saving ? "Saving..." : "Change Password"}
        </button>
      </div>
      <Feedback error={error} success={success} />
    </form>
  );
}
