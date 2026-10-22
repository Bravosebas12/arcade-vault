import Link from "next/link";

export type NavLink = { href: string; label: string; active: boolean };

type Props = {
  open: boolean;
  links: NavLink[];
  onClose: () => void;
};

export function MobileMenu({ open, links, onClose }: Props) {
  return (
    <>
      <div className={"av-mobile-backdrop" + (open ? " open" : "")} onClick={onClose}></div>
      <aside className={"av-mobile-panel" + (open ? " open" : "")}>
        <div className="pixel neon-cyan" style={{ fontSize: 11, marginBottom: 16 }}>MENÚ</div>
        {links.map((link) => (
          <Link key={link.href} href={link.href} className={link.active ? "active" : ""} onClick={onClose}>
            {link.label}
          </Link>
        ))}
        <div style={{ flex: 1 }}></div>
        <div className="pixel" style={{ fontSize: 9, color: "var(--ink-faint)", letterSpacing: "0.16em" }}>CRÉDITOS · 03</div>
      </aside>
    </>
  );
}
