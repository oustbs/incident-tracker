import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
      <h1 className="text-2xl font-bold">Incident Tracker</h1>
      <p className="text-muted-foreground">
        Lisez le <code className="bg-muted px-1.5 py-0.5 rounded text-sm">README.md</code> pour commencer.
      </p>
      <Link
        href="/incidents"
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Voir les incidents
      </Link>
    </main>
  );
}
