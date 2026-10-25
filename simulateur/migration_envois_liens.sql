-- =====================================================================
-- Administration : journal des envois de liens personnels
-- À exécuter dans Supabase > SQL Editor. Idempotente, aucune table existante modifiée.
--
-- Une ligne par mail parti (un renvoi volontaire ajoute une ligne). La page
-- /admin/liens s'en sert pour ne jamais envoyer deux fois le lien sans le vouloir.
-- Lecture et écriture réservées à service_role : RLS active sans politique,
-- et aucun droit pour anon / authenticated.
-- =====================================================================
begin;

create table if not exists envois_liens (
  id          bigint generated always as identity primary key,
  etudiant_id uuid not null references etudiants (id) on delete cascade,
  email       text not null,         -- adresse au moment de l'envoi
  mailgun_id  text,                  -- identifiant renvoyé par Mailgun
  envoye_at   timestamptz not null default now()
);

create index if not exists envois_liens_etudiant_idx on envois_liens (etudiant_id);

alter table envois_liens enable row level security;

revoke all on table envois_liens from public, anon, authenticated;
grant select, insert on table envois_liens to service_role;

commit;
