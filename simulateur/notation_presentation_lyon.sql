-- Notes de présentation finale, classe de Lyon (20/11/2026, données par Nathan)
--   8/20 : Logan Billouard, Romain Joannon, Julien Cherblanc, Mehdi Ziane
--   9/20 : Norayr Hayrapetyan (8 + 1)
--  16/20 : Adélaïde Wankou, Léa Tinet, Estelle Bouchaud

insert into notes_manuelles (etudiant_id, note_presentation, commentaire)
select et.id, v.note, v.commentaire
from etudiants et
join (values
  ('Billouard',   8::numeric, null::text),
  ('Joannon',     8, null),
  ('Cherblanc',   8, null),
  ('Ziane',       8, null),
  ('Hayrapetyan', 9, 'Présentation : 8/20 + 1'),
  ('Wankou',     16, null),
  ('Tinet',      16, null),
  ('Bouchaud',   16, null)
) as v(nom, note, commentaire) on v.nom = et.nom
where et.classe = 'lyon' and et.actif and not et.est_test
on conflict (etudiant_id) do update
  set note_presentation = excluded.note_presentation,
      commentaire = coalesce(excluded.commentaire, notes_manuelles.commentaire);
