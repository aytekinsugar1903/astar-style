import { corsHeaders, json } from "../_shared/http.ts";
import { clients } from "../_shared/clients.ts";

const USER_BUCKETS = ["user-photos", "try-on-results"] as const;

async function removeUserFiles(
  admin: ReturnType<typeof clients>["admin"],
  bucket: string,
  userId: string,
) {
  const pending = [userId];
  const visited = new Set<string>();
  while (pending.length) {
    const folder = pending.pop()!;
    if (visited.has(folder)) continue;
    visited.add(folder);
    // Deleting files at offset 0 avoids skipping files as each page shrinks.
    while (true) {
      const { data, error } = await admin.storage.from(bucket).list(folder, { limit: 100 });
      if (error) throw error;
      const paths = (data ?? []).filter((item) => Boolean(item.id)).map((item) => `${folder}/${item.name}`);
      const folders = (data ?? []).filter((item) => !item.id).map((item) => `${folder}/${item.name}`);
      pending.push(...folders.filter((path) => !visited.has(path)));
      if (paths.length) {
        const removed = await admin.storage.from(bucket).remove(paths);
        if (removed.error) throw removed.error;
      }
      // Pages containing only folders would otherwise repeat forever.
      if (!paths.length || (data ?? []).length < 100) break;
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

  try {
    const { confirmation } = await req.json();
    if (confirmation !== "DELETE_MY_ACCOUNT") {
      return json({ error: "CONFIRMATION_REQUIRED" }, 400);
    }

    const { user, admin } = clients(req);
    const authorization = req.headers.get("Authorization") ?? "";
    const token = authorization.replace(/^Bearer\s+/i, "");
    const { data: auth, error: authError } = await user.auth.getUser();

    if (authError || !auth.user || !token) {
      return json({ error: "UNAUTHORIZED" }, 401);
    }

    for (const bucket of USER_BUCKETS) {
      await removeUserFiles(admin, bucket, auth.user.id);
    }

    const revoked = await admin.auth.admin.signOut(token);
    if (revoked.error) throw revoked.error;

    const deleted = await admin.auth.admin.deleteUser(auth.user.id);
    if (deleted.error) throw deleted.error;

    return json({ deleted: true });
  } catch (error) {
    return json({
      error: error instanceof Error ? error.message : "ACCOUNT_DELETION_FAILED",
    }, 400);
  }
});

