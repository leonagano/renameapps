import { getStore } from "@/lib/store";
import { getRequestIpHash } from "@/lib/ip-hash";
import LaunchpadApp from "@/components/LaunchpadApp";

export const dynamic = "force-dynamic";

export default async function Home() {
  const store = await getStore();
  const ipHash = await getRequestIpHash();
  const [apps, feed] = await Promise.all([store.listApps(ipHash), store.listFeed(25)]);

  return <LaunchpadApp initialApps={apps} initialFeed={feed} />;
}
