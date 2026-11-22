import { WorkspacePage } from "@/components/workspace/WorkspacePage";

export default async function Page(props: PageProps<"/bus-operator/[[...slug]]">) {
  const { slug } = await props.params;
  return <WorkspacePage role="bus-operator" slug={slug} />;
}
