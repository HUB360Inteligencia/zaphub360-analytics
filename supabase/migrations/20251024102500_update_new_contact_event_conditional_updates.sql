-- Function: update_new_contact_event_if_empty_batch
-- Updates only empty fields (NULL or empty string) using CSV-provided values

CREATE OR REPLACE FUNCTION public.update_new_contact_event_if_empty_batch(
  records jsonb,
  p_org_id uuid
) RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated int;
BEGIN
  WITH payload AS (
    SELECT
      x.celular,
      nullif(btrim(x.name), '') AS name_csv,
      nullif(btrim(x.sobrenome), '') AS sobrenome_csv,
      nullif(btrim(x.cidade), '') AS cidade_csv,
      nullif(btrim(x.bairro), '') AS bairro_csv,
      nullif(btrim(x.perfil_contato), '') AS perfil_contato_csv,
      nullif(btrim(x.sentimento), '') AS sentimento_csv,
      nullif(btrim(x.evento), '') AS evento_csv,
      nullif(btrim(x.tag), '') AS tag_csv
    FROM jsonb_to_recordset(records) AS x(
      celular text,
      name text,
      sobrenome text,
      cidade text,
      bairro text,
      perfil_contato text,
      sentimento text,
      evento text,
      tag text
    )
  ), upd AS (
    UPDATE public.new_contact_event AS nce
    SET
      name = CASE WHEN coalesce(btrim(nce.name), '') = '' AND payload.name_csv IS NOT NULL THEN payload.name_csv ELSE nce.name END,
      sobrenome = CASE WHEN coalesce(btrim(nce.sobrenome), '') = '' AND payload.sobrenome_csv IS NOT NULL THEN payload.sobrenome_csv ELSE nce.sobrenome END,
      cidade = CASE WHEN coalesce(btrim(nce.cidade), '') = '' AND payload.cidade_csv IS NOT NULL THEN payload.cidade_csv ELSE nce.cidade END,
      bairro = CASE WHEN coalesce(btrim(nce.bairro), '') = '' AND payload.bairro_csv IS NOT NULL THEN payload.bairro_csv ELSE nce.bairro END,
      perfil_contato = CASE WHEN coalesce(btrim(nce.perfil_contato), '') = '' AND payload.perfil_contato_csv IS NOT NULL THEN payload.perfil_contato_csv ELSE nce.perfil_contato END,
      sentimento = CASE WHEN coalesce(btrim(nce.sentimento), '') = '' AND payload.sentimento_csv IS NOT NULL THEN payload.sentimento_csv ELSE nce.sentimento END,
      evento = CASE WHEN coalesce(btrim(nce.evento), '') = '' AND payload.evento_csv IS NOT NULL THEN payload.evento_csv ELSE nce.evento END,
      tag = CASE WHEN coalesce(btrim(nce.tag), '') = '' AND payload.tag_csv IS NOT NULL THEN payload.tag_csv ELSE nce.tag END
    FROM payload
    WHERE nce.organization_id = p_org_id
      AND nce.celular = payload.celular
    RETURNING 1
  )
  SELECT count(*) INTO v_updated FROM upd;

  RETURN v_updated;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_new_contact_event_if_empty_batch(jsonb, uuid) TO authenticated;