import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ tag: string }>;
}

export default async function OldTagRedirect({ params }: Props) {
  const { tag } = await params;
  redirect(`/noticias/tags/${tag}`);
}
