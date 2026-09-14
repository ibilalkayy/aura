import { getSupabaseClient } from "@/lib/supabase/client";

export type Notification = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
};

function mapNotification(n: NotificationRow): Notification {
  return {
    id: n.id,
    title: n.title,
    message: n.message,
    link: n.link,
    read: n.read,
    createdAt: n.created_at,
  };
}

export async function getNotifications(limit = 20): Promise<Notification[]> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, title, message, link, read, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map(mapNotification);
}

export async function markNotificationRead(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase.from("notifications").update({ read: true }).eq("id", id);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
}

// Subscribes to new notifications for a user via Supabase Realtime, so they
// appear the moment the server inserts them — no polling. Returns an
// unsubscribe function.
export function subscribeToNotifications(
  userId: string,
  onInsert: (n: Notification) => void
): () => void {
  const supabase = getSupabaseClient();
  const channel = supabase
    .channel(`notifications-${userId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      (payload) => onInsert(mapNotification(payload.new as NotificationRow))
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
