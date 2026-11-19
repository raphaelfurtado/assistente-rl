import { redirect } from "next/navigation";
import AdminApp from "@/components/admin/AdminApp";
import SiteNav from "@/components/SiteNav";
import { adminConfigured, isAdmin } from "@/lib/auth";
import { getConfig, storageKind } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin do assistente" };

export default async function AdminPage() {
  if (!adminConfigured()) {
    return (
      <main className="page">
        <div className="wrap">
          <SiteNav atual="admin" />
        </div>
        <div className="login-box card">
          <h1 className="login-title">Admin desligado</h1>
          <p className="hint">
            Para ligar a área de administração, defina a variável <code>ADMIN_PASSWORD</code> (no <code>.env.local</code> ou na Vercel,
            em Settings → Environment Variables) e reinicie ou faça um Redeploy.
          </p>
        </div>
      </main>
    );
  }
  if (!(await isAdmin())) redirect("/admin/login");

  const config = await getConfig({ fresh: true });
  return <AdminApp initial={config} storage={storageKind()} />;
}
