import { Suspense } from "react";
import SareesPageContent from "./SareesPageContent";

export default function SareesPage() {
  return (
    <Suspense fallback={null}>
      <SareesPageContent />
    </Suspense>
  );
}
