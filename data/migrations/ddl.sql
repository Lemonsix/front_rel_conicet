CREATE TABLE public.segmentos (
    id int4 NOT NULL,
    transecta_id int4 NOT NULL,
    numero int2 NOT NULL,
    largo float8 NOT NULL,
    profundidad_inicial float8 NULL,
    profundidad_final float8 NULL,
    sustrato_id int2 NULL,
    conteo int2 NULL,
    tiene_marisqueo bpchar(2) NULL,
    tiene_cuadrados bpchar(2) NULL,
    est_minima float8 NOT NULL,
    coordenadas_inicio public.geography(point, 4326) NULL,
    coordenadas_fin public.geography(point, 4326) NULL,
    CONSTRAINT segmentos_pk PRIMARY KEY (id),
    CONSTRAINT segmentos_fk_sustratos FOREIGN KEY (sustrato_id) REFERENCES public.sustratos(id),
    CONSTRAINT segmentos_fk_transectas FOREIGN KEY (transecta_id) REFERENCES public.transectas(id)
);