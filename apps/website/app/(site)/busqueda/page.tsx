import { Suspense } from "react";
import { SearchView } from "./SearchView";

export const dynamic = "force-dynamic";

export default function BusquedaPage() {
  return (
    <Suspense>
      <SearchView />
    </Suspense>
  );
}
