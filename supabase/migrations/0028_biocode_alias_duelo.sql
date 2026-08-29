-- ============================================================
-- OCEOM by E-MOTION® — BIOCODE: afinar alias de duelo vs infancia.
--
-- En la batería de 26 frases quedó un caso torcido: "perdí a mi papá hace un
-- año" caía en historia-infancia, porque "mi papa" y "mi mama" estaban como
-- alias de ese nodo. Son demasiado genéricos: quien nombra a un padre puede
-- estar hablando de su crianza o de una pérdida, y la palabra sola no lo
-- distingue. Se quitan de infancia (que ya tiene alias propios y claros) y el
-- duelo gana las formas en que se nombra una muerte de verdad.
-- ============================================================

update biocode_nodes
   set aliases = array_remove(array_remove(aliases, 'mi papa'), 'mi mama')
 where slug = 'historia-infancia';

update biocode_nodes
   set aliases = aliases || '{"perdi a mi papa","perdi a mi mama","perdi a mi","se me murio","fallecio","murio mi","no supero la muerte","luto"}'::text[]
 where slug = 'tristeza-duelo';
