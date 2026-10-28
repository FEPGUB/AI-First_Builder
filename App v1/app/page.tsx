import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>Orgenicemos</h1>
      <p>Gestión de eventos, invitaciones y RSVP.</p>
      <nav>
        <Link href="/register">Crear cuenta</Link>
        <Link href="/login">Iniciar sesión</Link>
        <Link href="/events/new">Nuevo evento</Link>
      </nav>
    </main>
  );
}
