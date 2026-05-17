import { CALCULATORS } from '@/lib/calculators/calculator-registry';
import { CalculatorPageClient } from './page-client';

// Tell Next.js all possible calculator IDs at build time (required for static export)
export function generateStaticParams() {
  return CALCULATORS.map((c) => ({ id: c.id }));
}

interface PageProps {
  params: { id: string };
}

export default function CalculatorPage({ params }: PageProps) {
  return <CalculatorPageClient id={params.id} />;
}
