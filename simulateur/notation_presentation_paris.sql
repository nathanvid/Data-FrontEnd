-- Notes de présentation finale, Paris 1 (G1) et Paris 2 (G2)
-- (20/11/2026, données par Nathan, précisions apportées en séance de notation)
--
-- Paris 2 (G2)
--   20   : Yanis Chikhi-Castéran
--   16   : Herivan, Mathys, Özge, Salma, Wissem, Eymeric ; Elyes, Samy, Lilian
--   15   : Clément Lecland, Giovanni Florio
--   14   : Yanis Schiff, Ilian Perraut, Tom Chanmoreau ; Thalya (13 + 1)
--   13   : Marc Ntouba (14 − 1, diapo non vérifié) ; Lina Derfoufi, Lina Hachhach
--   13   : Mayanna Blevat (supposée dans le groupe des Lina, « diapo Mayana »)
--   aucune note : Erol Muhtar
--
-- Paris 1 (G1)
--   20   : Malek, Mikael, Willan, Rayan, Nabil
--   15   : Tesnim, Nadjidina, Pauline, Maïa ; Giacomo, Keven, Thomas
--          (Maïa : sa note finale ne doit pas descendre sous 10/20)
--   13   : Lydia, Chaymaa, Myriam, Wiaam
--   11,5 : Laetitia, Yara, Amine, Walid, Youssef
--   « + 1 » de Mikael et Nabil : +1/20 sur l'enquête (ajustement + 0,5 sur 10)

insert into notes_manuelles (etudiant_id, note_presentation, commentaire)
select et.id, v.note, v.commentaire
from etudiants et
join (values
  -- Paris 2
  ('paris-2', 'Chikhi-Castéran', 20::numeric, null::text),
  ('paris-2', 'Rakotomavo',      16, null),
  ('paris-2', 'Bousselat',       16, null),
  ('paris-2', 'Gul',             16, null),
  ('paris-2', 'Dafali',          16, null),
  ('paris-2', 'Kefi',            16, null),
  ('paris-2', 'Maurage',         16, null),
  ('paris-2', 'Youcefi',         16, null),
  ('paris-2', 'Boughezala',      16, null),
  ('paris-2', 'Bouah',           16, null),
  ('paris-2', 'Lecland',         15, null),
  ('paris-2', 'Florio',          15, null),
  ('paris-2', 'Schiff',          14, null),
  ('paris-2', 'Perraut',         14, null),
  ('paris-2', 'Chanmoreau',      14, null),
  ('paris-2', 'Ntouba',          13, 'Présentation : 14/20 − 1 (diapo non vérifié)'),
  ('paris-2', 'Chidiac',         14, 'Présentation : 13/20 + 1 (n8n à la main)'),
  ('paris-2', 'Derfoufi',        13, null),
  ('paris-2', 'Hachhach',        13, null),
  ('paris-2', 'Blevat',          13, 'Présentation : groupe des Lina supposé (« diapo Mayana »)'),
  -- Paris 1
  ('paris-1', 'Maaloul',         20, null),
  ('paris-1', 'Kobtane',         15, null),
  ('paris-1', 'Ali',             15, null),
  ('paris-1', 'Cakmaz',          15, null),
  ('paris-1', 'Rodriguez',       15, 'Note finale : ne pas descendre sous 10/20'),
  ('paris-1', 'Ribeiro Araujo',  20, 'Présentation : 20/20 + 1, reporté sur l''enquête'),
  ('paris-1', 'Coste',           15, null),
  ('paris-1', 'Bougheriou',      15, null),
  ('paris-1', 'Declair',         15, null),
  ('paris-1', 'Josy',            20, null),
  ('paris-1', 'Mezouar',         20, null),
  ('paris-1', 'Zennouhi',        20, 'Présentation : 20/20 + 1, reporté sur l''enquête'),
  ('paris-1', 'Zafane',        11.5, null),
  ('paris-1', 'Elbahnasy',     11.5, null),
  ('paris-1', 'Rekaia',        11.5, null),
  ('paris-1', 'Amrani',        11.5, null),
  ('paris-1', 'Benhadria',     11.5, null),
  ('paris-1', 'Ould Hamou',      13, null),
  ('paris-1', 'Ihmad',           13, null),
  ('paris-1', 'Bedri',           13, null),
  ('paris-1', 'Khaled',          13, null)
) as v(classe, nom, note, commentaire) on v.nom = et.nom and v.classe = et.classe
where et.actif and not et.est_test
on conflict (etudiant_id) do update
  set note_presentation = excluded.note_presentation,
      commentaire = coalesce(excluded.commentaire, notes_manuelles.commentaire);

-- Le « + 1 » au-delà de 20 : +1/20 sur la note d'enquête
update notes_manuelles nm set ajustement = coalesce(nm.ajustement, 0) + 0.5
from etudiants et
where et.id = nm.etudiant_id and et.classe = 'paris-1'
  and et.nom in ('Ribeiro Araujo', 'Zennouhi');
