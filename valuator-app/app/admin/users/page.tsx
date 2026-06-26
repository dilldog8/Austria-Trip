import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import InviteUserForm from "./InviteUserForm";

export default async function AdminUsersPage() {
  const supabase = createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login");
  }

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", userData.user!.id)
    .single();

  if (!myProfile || myProfile.role !== "admin") {
    redirect("/dashboard");
  }

  const admin = createAdminClient();

  const { data: members } = await admin
    .from("profiles")
    .select("id, full_name, role, created_at")
    .eq("org_id", myProfile.org_id)
    .order("created_at", { ascending: true });

  const { data: usersList } = await admin.auth.admin.listUsers();
  const emailById = new Map(
    (usersList?.users ?? []).map((u) => [u.id, u.email ?? "—"])
  );

  return (
    <div className="container">
      <div className="topbar">
        <h1 style={{ margin: 0, fontSize: "1.4rem" }}>Manage Users</h1>
        <Link href="/dashboard">Back to jobs</Link>
      </div>

      <div className="card">
        <h2 style={{ fontSize: "1.1rem" }}>Team Members</h2>
        {(members ?? []).map((m) => (
          <div key={m.id} className="comparable-row">
            <div>{m.full_name || "—"}</div>
            <div>{emailById.get(m.id)}</div>
            <div>{m.role}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: "1.5rem" }}>
        <h2 style={{ fontSize: "1.1rem" }}>Invite a Valuer</h2>
        <InviteUserForm />
      </div>
    </div>
  );
}
