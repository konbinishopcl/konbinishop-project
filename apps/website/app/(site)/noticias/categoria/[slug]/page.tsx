import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function OldCategoryRedirect({ params }: Props) {
  const { slug } = await params;
  redirect(`/noticias/categorias/${slug}`);
}
