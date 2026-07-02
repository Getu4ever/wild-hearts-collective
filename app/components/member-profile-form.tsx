"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PublicMember } from "@/lib/member-auth";

type MemberProfileFormProps = {
  member: PublicMember;
};

export function MemberProfileForm({ member }: MemberProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState(member.name);
  const [phone, setPhone] = useState(member.phone ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/members/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          currentPassword: newPassword ? currentPassword : undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Unable to update profile.");
        return;
      }

      setMessage("Profile updated.");
      setCurrentPassword("");
      setNewPassword("");
      router.refresh();
    } catch {
      setError("Unable to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-plum">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={member.email}
          disabled
          className="mt-2 w-full rounded-sm border border-plum/10 bg-cream/60 px-4 py-3 text-sm text-muted"
        />
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-plum">
          Full name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-2 w-full rounded-sm border border-plum/15 px-4 py-3 text-sm outline-none ring-pink focus:border-pink focus:ring-1"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-semibold text-plum">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="mt-2 w-full rounded-sm border border-plum/15 px-4 py-3 text-sm outline-none ring-pink focus:border-pink focus:ring-1"
        />
      </div>

      <div className="border-t border-plum/10 pt-5">
        <h2 className="font-display text-2xl text-plum">Change password</h2>
        <p className="mt-1 text-sm text-muted">Leave blank to keep your current password.</p>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-semibold text-plum">
              Current password
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="mt-2 w-full rounded-sm border border-plum/15 px-4 py-3 text-sm outline-none ring-pink focus:border-pink focus:ring-1"
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-semibold text-plum">
              New password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="mt-2 w-full rounded-sm border border-plum/15 px-4 py-3 text-sm outline-none ring-pink focus:border-pink focus:ring-1"
            />
          </div>
        </div>
      </div>

      {message && (
        <p className="text-sm text-sage" role="status">
          {message}
        </p>
      )}

      {error && (
        <p className="text-sm text-brand" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-sm bg-plum px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-plum-hover disabled:opacity-60"
      >
        {loading ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
