import HomeClient from "@/components/HomeClient";
import { fetchEntries, fetchTypes, fetchRandomEntry } from "@/data/entries";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; page?: string }>;
}) {
  const { q = "", type = "", page: pageStr = "1" } = await searchParams;
  const page = parseInt(pageStr, 10);

  const [types, featured, entriesResult] = await Promise.all([
    fetchTypes(),
    fetchRandomEntry(),
    fetchEntries({
      query: q || undefined,
      type: type || undefined,
      limit: PAGE_SIZE + 1,
      offset: (page - 1) * PAGE_SIZE,
    }),
  ]);

  const hasMore = entriesResult.length > PAGE_SIZE;
  const entries = entriesResult.slice(0, PAGE_SIZE);
  const totalPages = hasMore ? page + 1 : page;

  return (
    <HomeClient
      types={types}
      featured={featured}
      initialEntries={entries}
      initialTotalPages={totalPages}
      searchParams={{ q, type, page }}
    />
  );
}
