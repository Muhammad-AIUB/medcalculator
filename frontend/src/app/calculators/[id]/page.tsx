import { CALCULATORS } from '@/lib/calculators/calculator-registry';
import { CalculatorPageClient } from './page-client';

// Tell Next.js all possible calculator IDs at build time (required for static export)
export function generateStaticParams() {
  const ids = new Set([...CALCULATORS.map((c) => c.id), 'gcs', 'sofa-2', 'aih', 'original-aih', 'frax', 'cdai', 'sdai', 'basdai']);
  return Array.from(ids).map((id) => ({ id }));
}

interface PageProps {
  params: { id: string };
}

export default function CalculatorPage({ params }: PageProps) {
  return <CalculatorPageClient id={params.id} />;
}
