"use client";

import { useState } from "react";
import { Ic } from "./icons";
import { useUser } from "./providers";
import { MOCK_USER, type User } from "@/lib/data";

export function ProfileModal({ onClose }: { onClose: () => void }) {
  const { user, setUser } = useUser();
  const [f, setF] = useState<User>({ ...(user ?? MOCK_USER) });

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="icon-btn x" onClick={onClose}>{Ic.close}</button>
        <div className="eyebrow">CUENTA · アカウント</div>
        <h2 style={{ marginTop: 8 }}>Editar perfil</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div className="avatar" style={{ width: 64, height: 64, fontSize: 22 }}>{f.initials}</div>
          <div>
            <button className="btn ghost" style={{ fontSize: 12, padding: "8px 14px" }}>Cambiar foto</button>
            <div style={{ color: "var(--ink-3)", fontSize: 11, marginTop: 6 }}>JPG / PNG · máx 2MB</div>
          </div>
        </div>
        <div className="field">
          <label>Nombre y apellido</label>
          <input type="text" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </div>
        <div className="field">
          <label>Correo electrónico</label>
          <input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        </div>
        <div className="field">
          <label>Teléfono móvil</label>
          <input type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        </div>
        <button
          className="btn dark lg block"
          onClick={() => {
            setUser({
              ...f,
              initials: f.name
                .split(" ")
                .map((s) => s[0])
                .slice(0, 2)
                .join("")
                .toUpperCase(),
            });
            onClose();
          }}
        >
          Guardar cambios
        </button>
      </div>
    </div>
  );
}
