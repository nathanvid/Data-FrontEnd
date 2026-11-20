-- Note de présentation finale, saisie à la main (/20), distincte de la note d'enquête
-- (20/11/2026, demandé par Nathan).
-- La vue v_note_enquete l'expose en dernière colonne ; note_sur_20 n'en tient pas compte.

alter table public.notes_manuelles
  add column if not exists note_presentation numeric(4,2)
    check (note_presentation between 0 and 20);

create or replace view public.v_note_enquete
with (security_invoker = true) as
with base as (
  select et.id, et.classe, et.groupe, et.nom, et.prenom, et.email,
    (select count(*) from deblocages d where d.etudiant_id = et.id) as faits,
    (exists (select 1 from deblocages d
             where d.etudiant_id = et.id and d.fait_id = 'sophie_enveloppe')) as enveloppe,
    (select count(distinct e.personnage_id) from echanges e
      where e.etudiant_id = et.id and e.issue = 'reponse') as atteints,
    (select count(distinct r.vers_personnage) from recommandations r
       join personnages p on p.id = r.vers_personnage and not p.porte_entree
      where r.etudiant_id = et.id) as debloques,
    (select count(*) from echanges e
      where e.etudiant_id = et.id and e.generique) as generiques,
    (select count(*) from echanges e
      where e.etudiant_id = et.id and e.issue = 'refus_sans_reco') as refus,
    (select count(*) from echanges e
      where e.etudiant_id = et.id and e.issue in ('reponse', 'refus_sans_reco')) as mails,
    coalesce(nm.chatbot_evite, false) as chatbot_evite,
    coalesce(nm.ajustement, 0::numeric) as ajustement,
    nm.commentaire,
    nm.note_presentation
  from etudiants et
  left join notes_manuelles nm on nm.etudiant_id = et.id
  where not et.est_test and et.actif
), points as (
  select b.*,
    0.5 * least(b.faits, 11)::numeric as pts_faits,
    case when b.enveloppe then 0.5 else 0::numeric end as pts_enveloppe,
    0.5 * least(b.debloques, 6)::numeric as pts_debloques,
    case when b.chatbot_evite then 1 else 0 end as pts_chatbot,
    - least(0.5 * b.generiques::numeric, 2::numeric) as pts_generiques
  from base b
)
select classe, groupe, nom, prenom, email, mails, faits, enveloppe, atteints,
  debloques, generiques, refus, chatbot_evite,
  pts_faits, pts_enveloppe, pts_debloques, pts_chatbot, pts_generiques, ajustement,
  (round(greatest(0::numeric, least(10::numeric,
     pts_faits + pts_enveloppe + pts_debloques + pts_chatbot::numeric + pts_generiques + ajustement)) * 4) / 4)::numeric(4,2) as note_sur_10,
  (round(greatest(0::numeric, least(10::numeric,
     pts_faits + pts_enveloppe + pts_debloques + pts_chatbot::numeric + pts_generiques + ajustement)) * 8) / 4)::numeric(4,2) as note_sur_20,
  commentaire,
  note_presentation
from points
order by classe, nom, prenom;

revoke all on public.v_note_enquete from public, anon, authenticated;
grant select on public.v_note_enquete to service_role;
