import { InvitationAccept } from "@/components/team/InvitationAccept";

export const metadata = {
  title: "Team invitation — Lumiticket",
};

export default async function InvitationPage(props: PageProps<"/invitations/[token]">) {
  const { token } = await props.params;
  return <InvitationAccept token={token} />;
}