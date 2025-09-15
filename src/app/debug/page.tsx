export default function Debug() {
  return (
    <main style={{padding:24,fontFamily:"sans-serif"}}>
      <h1>/debug alive</h1>
      <p>{new Date().toISOString()}</p>
    </main>
  );
}
