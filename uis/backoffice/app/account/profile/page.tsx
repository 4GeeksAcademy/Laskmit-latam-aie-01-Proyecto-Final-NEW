"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiRequest, getErrorMessage } from "../../../lib/api-client";
import type { CurrentUser, UserProfile } from "../../../lib/auth-types";

interface EditableProfile {
  name: string;
  phone: string;
  address: string;
}

const EMPTY_PROFILE: EditableProfile = { name: "", phone: "", address: "" };

function editableProfile(profile: UserProfile | null): EditableProfile {
  return {
    name: profile?.name ?? "",
    phone: profile?.phone ?? "",
    address: profile?.address ?? "",
  };
}

export default function ProfilePage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [profile, setProfile] = useState<EditableProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile(): Promise<void> {
      try {
        const currentUser = await apiRequest<CurrentUser>("/auth/me");
        if (!active) return;
        setUser(currentUser);
        setProfile(editableProfile(currentUser.profile));
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError));
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProfile();
    return () => {
      active = false;
    };
  }, []);

  function updateField(field: keyof EditableProfile, value: string): void {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const updated = await apiRequest<UserProfile>("/profiles/me", {
        method: "PUT",
        body: {
          name: profile.name || null,
          phone: profile.phone || null,
          address: profile.address || null,
        },
      });
      setProfile(editableProfile(updated));
      setUser((current) => current ? { ...current, profile: updated } : current);
      setSuccess("Perfil actualizado correctamente.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="profilePage" role="status">Cargando perfil...</main>;
  }

  return (
    <main className="profilePage">
      <section className="profilePanel" aria-labelledby="profile-title">
        <p className="authEyebrow">Cuenta Nexova</p>
        <h1 id="profile-title">Mi perfil</h1>

        {user && (
          <dl className="profileIdentity">
            <div><dt>Email</dt><dd>{user.email}</dd></div>
            <div><dt>Rol</dt><dd>{user.role}</dd></div>
          </dl>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="name">Nombre</label>
          <input id="name" value={profile.name} onChange={(event) => updateField("name", event.target.value)} autoComplete="name" />

          <label htmlFor="phone">Teléfono</label>
          <input id="phone" type="tel" value={profile.phone} onChange={(event) => updateField("phone", event.target.value)} autoComplete="tel" />

          <label htmlFor="address">Dirección</label>
          <input id="address" value={profile.address} onChange={(event) => updateField("address", event.target.value)} autoComplete="street-address" />

          <p className="authError" role="alert" aria-live="assertive">{error}</p>
          <p className="profileSuccess" role="status" aria-live="polite">{success}</p>
          <button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</button>
        </form>
      </section>
    </main>
  );
}