import { WorkspacePage } from "@/components/workspace/WorkspacePage";

export default async function Page(props: PageProps<"/admin/[[...slug]]">) {
  const { slug } = await props.params;
  return <WorkspacePage role="staff" slug={slug} />;
}
