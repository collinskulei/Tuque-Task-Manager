import { createClient } from "@/lib/supabase/server";
import { getNotifications } from "@/lib/data";
import { InboxView } from "@/components/tasks/inbox-view";

export default async function InboxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const notifications = await getNotifications(user!.id);

  return <InboxView notifications={notifications} />;
}
