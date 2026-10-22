"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/features/session/SessionProvider";
import { MobileMenu } from "@/shared/components/MobileMenu";

// Biblioteca stays active on the game detail and player routes, as in the prototype.
const isLibrary = (path: string) => path === "/" || path.startsWith("/juegos");

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useSession();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const library = isLibrary(pathname);
  const hall = pathname === "/salon";

  return (
    <>
      <nav className="av-nav">
        <Link href="/" className="logo" onClick={close}>
          <div className="logo-mark"></div>
          <div className="logo-text neon-cyan">ARCADE <span className="neon-magenta">VAULT</span></div>
        </Link>
        <div className="links">
          <Link href="/" className={library ? "active" : ""}>Biblioteca</Link>
          <Link href="/salon" className={hall ? "active" : ""}>Salón de la Fama</Link>
        </div>
        <div className="spacer"></div>
        <div className="coin-counter">
          <span className="coin"></span>
          <span>CRÉDITOS · 03</span>
        </div>
        {user ? (
          <button className="btn ghost auth-btn" onClick={signOut}>{user.name} ▾</button>
        ) : (
          <button className="btn auth-btn" onClick={() => router.push("/acceso")}>Iniciar Sesión</button>
        )}
        <button className="btn ghost hamburger" onClick={() => setOpen(true)} aria-label="Menú">≡</button>
      </nav>

      <MobileMenu
        open={open}
        onClose={close}
        links={[
          { href: "/", label: "Biblioteca", active: library },
          { href: "/salon", label: "Salón de la Fama", active: hall },
          { href: "/acceso", label: user ? "Cuenta" : "Iniciar Sesión", active: pathname === "/acceso" },
        ]}
      />
    </>
  );
}
