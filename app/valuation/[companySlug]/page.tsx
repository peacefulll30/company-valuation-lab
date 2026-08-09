import { redirect } from "next/navigation";

export default async function CompanyWorkspaceIndexPage({
  params,
}: PageProps<"/valuation/[companySlug]">) {
  const { companySlug } = await params;
  redirect(`/valuation/${companySlug}/overview`);
}
