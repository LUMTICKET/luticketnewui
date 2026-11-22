import { WorkspacePage } from "@/components/workspace/WorkspacePage";

export default async function Page(props: PageProps<"/organizer/[[...slug]]">) {
  const { slug } = await props.params;
  return <WorkspacePage role="organizer" slug={slug} />;
}
