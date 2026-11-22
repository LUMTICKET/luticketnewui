import { WorkspacePage } from "@/components/workspace/WorkspacePage";

export default async function Page(props: PageProps<"/courier/[[...slug]]">) {
  const { slug } = await props.params;
  return <WorkspacePage role="courier" slug={slug} />;
}
