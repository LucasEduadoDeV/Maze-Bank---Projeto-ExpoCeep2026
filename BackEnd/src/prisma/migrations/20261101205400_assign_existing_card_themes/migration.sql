-- Assign distinct palette colors to existing cards without relying on list order.
WITH ranked_cards AS (
  SELECT
    "id_card",
    (ROW_NUMBER() OVER (PARTITION BY "user_id" ORDER BY "id_card") - 1) % 3 AS theme
  FROM "cards"
)
UPDATE "cards"
SET "theme" = ranked_cards.theme
FROM ranked_cards
WHERE "cards"."id_card" = ranked_cards."id_card";
