import { WorkspacePage } from "@/components/workspace/WorkspacePage";

export default async function Page(props: PageProps<"/agent/[[...slug]]">) {
  const { slug } = await props.params;
  return <WorkspacePage role="agent" slug={slug} />;
}
