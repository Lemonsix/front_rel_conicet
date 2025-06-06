-- Migración para optimizar consultas de campaña por ID
-- Esta función RPC reduce el problema N+1 al obtener primer y último segmento de cada transecta
CREATE OR REPLACE FUNCTION get_first_last_segments_by_transectas(transecta_ids integer []) RETURNS TABLE (
        id integer,
        transecta_id integer,
        numero smallint,
        largo double precision,
        profundidad_inicial double precision,
        profundidad_final double precision,
        sustrato_id smallint,
        conteo smallint,
        tiene_marisqueo character(2),
        tiene_cuadrados character(2),
        est_minima double precision,
        coordenadas_inicio geography(Point, 4326),
        coordenadas_fin geography(Point, 4326),
        tiene_marisqueos_bool boolean,
        tiene_cuadrados_bool boolean,
        segment_position text
    ) LANGUAGE SQL STABLE AS $$ WITH ranked_segments AS (
        SELECT s.*,
            ROW_NUMBER() OVER (
                PARTITION BY s.transecta_id
                ORDER BY s.numero ASC
            ) as first_rank,
            ROW_NUMBER() OVER (
                PARTITION BY s.transecta_id
                ORDER BY s.numero DESC
            ) as last_rank
        FROM segmentos s
        WHERE s.transecta_id = ANY(transecta_ids)
    )
SELECT rs.id,
    rs.transecta_id,
    rs.numero,
    rs.largo,
    rs.profundidad_inicial,
    rs.profundidad_final,
    rs.sustrato_id,
    rs.conteo,
    rs.tiene_marisqueo,
    rs.tiene_cuadrados,
    rs.est_minima,
    rs.coordenadas_inicio,
    rs.coordenadas_fin,
    rs.tiene_marisqueos_bool,
    rs.tiene_cuadrados_bool,
    CASE
        WHEN rs.first_rank = 1 THEN 'first'
        WHEN rs.last_rank = 1 THEN 'last'
    END as segment_position
FROM ranked_segments rs
WHERE rs.first_rank = 1
    OR rs.last_rank = 1;
$$;
-- Dar permisos para que usuarios autenticados puedan ejecutar la función RPC
GRANT EXECUTE ON FUNCTION get_first_last_segments_by_transectas(integer []) TO authenticated;