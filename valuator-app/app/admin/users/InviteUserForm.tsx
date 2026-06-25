"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InviteUserForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const res = await fetch("/api/admin/invite-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        fullName: formData.get("fullName"),
      }),
    });
    const body = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? "Failed to invite user");
      return;
    }

    form.reset();
    router.refresh();
  }

  return (
    <form className="comparable-row" onSubmit={handleSubmit}>
      <input name="fullName" placeholder="Full name" />
      <input name="email" type="email" placeholder="Email address" required />
      <button type="submit" style={{ marginTop: 0 }} disabled={loading}>
        {loading ? "Inviting..." : "Invite Valuer"}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
