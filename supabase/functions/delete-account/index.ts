import { corsHeaders, json } from "../_shared/http.ts";
import { clients } from "../_shared/clients.ts";

const USER_BUCKETS = ["user-photos", "try-on-results"] as const;

async function removeUserFiles(
  admin: ReturnType<typeof clients>["admin"],
  bucket: string,
  userId: string,
) {
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await admin.storage.from(bucket).list(userId, {
      limit: pageSize,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw error;

    const paths = (data ?? [])
      .filter((item) => Boolean(item.id))
      .map((item) => `${userId}/${item.name}`);

    if (paths.length) {
      const removed = await admin.storage.from(bucket).remove(paths);
      if (removed.error) throw removed.error;
    }

    if ((data ?? []).length < pageSize) break;
    offset += pageSize;
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
