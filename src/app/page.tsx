export default function Home() {
  return (
    <main className="min-h-screen grid place-items-center p-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">AV Budget Reality Check</h1>
        <p>Board-ready cost ranges + risk flags in 60 seconds.</p>
        <a href="/estimate" className="inline-block rounded-xl px-6 py-3 bg-black text-white">
          Run Reality Check →
        </a>
      </div>
    </main>
  );
}
