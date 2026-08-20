"use client";

import { useEffect, useState } from "react";

type RewardCampaignSettings = {
  winbackEnabled: boolean;
  birthdayEnabled: boolean;
  milestoneEnabled: boolean;
  inactivityDays: number;
  birthdayValidDays: number;
  milestoneThresholds: number[];
};

function CampaignSwitch({
  label,
  checked,
  disabled,
  onToggle,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="inline-flex shrink-0 items-center gap-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted">
        {checked ? "On" : "Off"}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={onToggle}
        className={`relative h-7 w-12 rounded-full transition ${
          checked ? "bg-sage" : "bg-plum/20"
        } disabled:opacity-60`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}

export function AdminWinbackPanel() {
  const [settings, setSettings] = useState<RewardCampaignSettings | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/engagement")
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.settings) {
          throw new Error(payload?.error ?? "Unable to load reward settings.");
        }
        setSettings(payload.settings);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Unable to load reward settings."),
      );
  }, []);

  async function patchSettings(
    next: Partial<
      Pick<
        RewardCampaignSettings,
        "winbackEnabled" | "birthdayEnabled" | "milestoneEnabled"
      >
    >,
    successMessage: string,
  ) {
    setLoading(Object.keys(next)[0] ?? "saving");
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/engagement", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update reward emails.");
      }
      setSettings(payload.settings);
      setMessage(successMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update reward emails.");
    } finally {
      setLoading(null);
    }
  }

  if (error && !settings) {
    return <p className="text-sm text-brand">{error}</p>;
  }

  if (!settings) {
    return <p className="text-sm text-muted">Loading reward settings…</p>;
  }

  const milestoneLabel = settings.milestoneThresholds.join(" / ");

  return (
    <section className="rounded-sm border border-plum/10 bg-surface p-6">
      <h2 className="font-display text-2xl text-plum">Reward emails</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        Turn each automated reward on or off. Attendance is still recorded when milestone
        emails are off — the free-class voucher is just held until you switch them back on.
      </p>

      <div className="mt-6 divide-y divide-plum/10">
        <div className="flex flex-col gap-4 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-plum">Win-back emails</h3>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
              Members who have not attended for {settings.inactivityDays} days receive one
              email with a 20% off code.
            </p>
          </div>
          <CampaignSwitch
            label="Win-back emails"
            checked={settings.winbackEnabled}
            disabled={loading !== null}
            onToggle={() =>
              void patchSettings(
                { winbackEnabled: !settings.winbackEnabled },
                settings.winbackEnabled
                  ? "Win-back emails are off. No further inactive-member emails will be sent until you turn this back on."
                  : "Win-back emails are on. Members inactive for 30 days will receive one email with a 20% code.",
              )
            }
          />
        </div>

        <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-plum">Birthday rewards</h3>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
              On a member&apos;s birthday they get a 100% off class code, valid for{" "}
              {settings.birthdayValidDays} days. Date of birth must be saved on their
              profile (Members → edit, or they can add it themselves).
            </p>
          </div>
          <CampaignSwitch
            label="Birthday rewards"
            checked={settings.birthdayEnabled}
            disabled={loading !== null}
            onToggle={() =>
              void patchSettings(
                { birthdayEnabled: !settings.birthdayEnabled },
                settings.birthdayEnabled
                  ? "Birthday rewards are off. No birthday emails will be sent until you turn this back on."
                  : "Birthday rewards are on. Members with a date of birth on file will receive a free-class code on their birthday.",
              )
            }
          />
        </div>

        <div className="flex flex-col gap-4 py-4 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-plum">Class milestones</h3>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
              When attendance is marked as attended, members reaching {milestoneLabel}{" "}
              classes receive a 100% off code (valid 60 days). 50 and 100 are included;
              150 is also awarded if they keep coming.
            </p>
          </div>
          <CampaignSwitch
            label="Class milestone rewards"
            checked={settings.milestoneEnabled}
            disabled={loading !== null}
            onToggle={() =>
              void patchSettings(
                { milestoneEnabled: !settings.milestoneEnabled },
                settings.milestoneEnabled
                  ? "Milestone rewards are off. Class counts still increase, but no 50/100/150 vouchers will be emailed until you turn this back on."
                  : `Milestone rewards are on. Members will be emailed a free-class code at ${milestoneLabel} attended classes.`,
              )
            }
          />
        </div>
      </div>

      {message ? <p className="mt-4 text-sm text-plum">{message}</p> : null}
      {error ? <p className="mt-4 text-sm text-brand">{error}</p> : null}
    </section>
  );
}
