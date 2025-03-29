--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 16.8 (Ubuntu 16.8-0ubuntu0.24.04.1)
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA public;
ALTER SCHEMA public OWNER TO postgres;
--
-- Name: campanias_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.campanias_id_seq START WITH 69 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.campanias_id_seq OWNER TO postgres;
SET default_tablespace = '';
SET default_table_access_method = heap;
--
-- Name: campanias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.campanias (
    id bigint DEFAULT nextval('public.campanias_id_seq'::regclass) NOT NULL,
    nombre text,
    inicio date NOT NULL,
    fin date,
    cant_transectas integer,
    responsable_id integer NOT NULL,
    observaciones text,
    link_pdf text
);
ALTER TABLE public.campanias OWNER TO postgres;
--
-- Name: cuadrados; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cuadrados (
    id bigint NOT NULL,
    segmento_id bigint NOT NULL,
    replica integer NOT NULL,
    "timestamp" timestamp without time zone,
    conteo smallint,
    tamanio double precision NOT NULL,
    tiene_muestreo character(2),
    profundidad_inicio double precision,
    profundidad_fin double precision,
    coordenadas_inicio public.geography(Point, 4326),
    coordenadas_fin public.geography(Point, 4326)
);
ALTER TABLE public.cuadrados OWNER TO postgres;
--
-- Name: embarcaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.embarcaciones_id_seq START WITH 14 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.embarcaciones_id_seq OWNER TO postgres;
--
-- Name: embarcaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.embarcaciones (
    id integer DEFAULT nextval('public.embarcaciones_id_seq'::regclass) NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    matricula text
);
ALTER TABLE public.embarcaciones OWNER TO postgres;
--
-- Name: marisqueos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.marisqueos (
    id bigint NOT NULL,
    segmento_id bigint NOT NULL,
    "timestamp" timestamp without time zone,
    n_captura smallint NOT NULL,
    tiempo smallint,
    peso_muestra double precision,
    buzo_id integer NOT NULL,
    profundidad double precision,
    coordenadas public.geography(Point, 4326),
    tiene_muestreo boolean
);
ALTER TABLE public.marisqueos OWNER TO postgres;
--
-- Name: muestreos_cuadrados; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.muestreos_cuadrados (
    quadrat_id integer NOT NULL,
    id_ind integer NOT NULL,
    talla double precision,
    peso_tot double precision,
    peso_val double precision,
    peso_callo double precision
);
ALTER TABLE public.muestreos_cuadrados OWNER TO postgres;
--
-- Name: personas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.personas_id_seq START WITH 81 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.personas_id_seq OWNER TO postgres;
--
-- Name: personas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.personas (
    id bigint DEFAULT nextval('public.personas_id_seq'::regclass) NOT NULL,
    nombre text NOT NULL,
    apellido text NOT NULL,
    rol text NOT NULL
);
ALTER TABLE public.personas OWNER TO postgres;
--
-- Name: resultados; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resultados (
    date timestamp without time zone NOT NULL,
    transect_id integer NOT NULL,
    transecta character(10),
    replica character(2),
    sentido character(5),
    buzo character varying(101)
);
ALTER TABLE public.resultados OWNER TO postgres;
--
-- Name: segmentos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.segmentos_id_seq START WITH 11894 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.segmentos_id_seq OWNER TO postgres;
--
-- Name: segmentos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.segmentos (
    id integer DEFAULT nextval('public.segmentos_id_seq'::regclass) NOT NULL,
    transecta_id integer NOT NULL,
    numero smallint NOT NULL,
    largo double precision NOT NULL,
    profundidad_inicial double precision,
    profundidad_final double precision,
    sustrato_id smallint,
    conteo smallint,
    tiene_marisqueo character(2),
    tiene_cuadrados character(2),
    est_minima double precision NOT NULL,
    coordenadas_inicio public.geography(Point, 4326),
    coordenadas_fin public.geography(Point, 4326),
    tiene_marisqueos_bool boolean,
    tiene_cuadrados_bool boolean
);
ALTER TABLE public.segmentos OWNER TO postgres;
--
-- Name: sustratos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sustratos (
    id smallint NOT NULL,
    codigo character varying(2),
    descripcion text
);
ALTER TABLE public.sustratos OWNER TO postgres;
--
-- Name: tallasmarisqueo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tallasmarisqueo (
    marisqueo_id integer NOT NULL,
    id_ind smallint NOT NULL,
    talla double precision NOT NULL,
    peso_tot double precision,
    peso_val double precision
);
ALTER TABLE public.tallasmarisqueo OWNER TO postgres;
--
-- Name: tallasmarisqueo2; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tallasmarisqueo2 (
    marisqueo_id integer NOT NULL,
    talla smallint NOT NULL,
    frecuencia smallint NOT NULL
);
ALTER TABLE public.tallasmarisqueo2 OWNER TO postgres;
--
-- Name: transectas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transectas_id_seq START WITH 1032 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.transectas_id_seq OWNER TO postgres;
--
-- Name: transectas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transectas (
    id bigint DEFAULT nextval('public.transectas_id_seq'::regclass) NOT NULL,
    campania_id bigint NOT NULL,
    nombre text,
    fecha date NOT NULL,
    hora_inicio timestamp without time zone,
    hora_fin timestamp without time zone,
    buzo_id integer,
    replica boolean,
    observaciones text,
    grad_lati double precision,
    min_lati double precision,
    seg_lati double precision,
    grad_longi double precision,
    min_longi double precision,
    seg_longi double precision,
    profundidad_inicial double precision,
    planillero_id bigint,
    embarcacion_id bigint,
    sentido character(5)
);
ALTER TABLE public.transectas OWNER TO postgres;
--
-- Name: transectas_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transectas_templates (
    id integer NOT NULL,
    nombre character varying(10),
    area integer,
    region character varying(50),
    costa character varying(50),
    region_secundaria character varying(50),
    orientacion text
);
ALTER TABLE public.transectas_templates OWNER TO postgres;
--
-- Name: campanias campaigns_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campanias
ADD CONSTRAINT campaigns_pk PRIMARY KEY (id);
--
-- Name: sustratos fondos_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sustratos
ADD CONSTRAINT fondos_pk PRIMARY KEY (id);
--
-- Name: marisqueos marisqueos_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marisqueos
ADD CONSTRAINT marisqueos_pk PRIMARY KEY (id);
--
-- Name: personas persons_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personas
ADD CONSTRAINT persons_pk PRIMARY KEY (id);
--
-- Name: cuadrados quadrats_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuadrados
ADD CONSTRAINT quadrats_pk PRIMARY KEY (id);
--
-- Name: segmentos segmentos_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.segmentos
ADD CONSTRAINT segmentos_pk PRIMARY KEY (id);
--
-- Name: embarcaciones ships_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.embarcaciones
ADD CONSTRAINT ships_pk PRIMARY KEY (id);
--
-- Name: transectas_templates transect_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transectas_templates
ADD CONSTRAINT transect_templates_pkey PRIMARY KEY (id);
--
-- Name: transectas transects_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transectas
ADD CONSTRAINT transects_pk PRIMARY KEY (id);
--
-- Name: cuadrados_segmento_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cuadrados_segmento_id_idx ON public.cuadrados USING btree (segmento_id);
--
-- Name: marisqueos_segmento_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX marisqueos_segmento_id_idx ON public.marisqueos USING btree (segmento_id);
--
-- Name: segmentos_transect_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX segmentos_transect_id_idx ON public.segmentos USING btree (transecta_id);
--
-- Name: transectas_campania_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX transectas_campania_id_idx ON public.transectas USING btree (campania_id);
--
-- Name: campanias campanias_fk_responsable_personas; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campanias
ADD CONSTRAINT campanias_fk_responsable_personas FOREIGN KEY (responsable_id) REFERENCES public.personas(id);
--
-- Name: cuadrados cuadrados_fk_segmentos; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuadrados
ADD CONSTRAINT cuadrados_fk_segmentos FOREIGN KEY (segmento_id) REFERENCES public.segmentos(id);
--
-- Name: tallasmarisqueo fk_marisqueo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tallasmarisqueo
ADD CONSTRAINT fk_marisqueo FOREIGN KEY (marisqueo_id) REFERENCES public.marisqueos(id);
--
-- Name: tallasmarisqueo2 fk_marisqueo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tallasmarisqueo2
ADD CONSTRAINT fk_marisqueo FOREIGN KEY (marisqueo_id) REFERENCES public.marisqueos(id);
--
-- Name: muestreos_cuadrados fk_quadrat; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.muestreos_cuadrados
ADD CONSTRAINT fk_quadrat FOREIGN KEY (quadrat_id) REFERENCES public.cuadrados(id);
--
-- Name: resultados fk_transect; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultados
ADD CONSTRAINT fk_transect FOREIGN KEY (transect_id) REFERENCES public.transectas(id);
--
-- Name: marisqueos marisqueos_fk_buzo_personas; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marisqueos
ADD CONSTRAINT marisqueos_fk_buzo_personas FOREIGN KEY (buzo_id) REFERENCES public.personas(id);
--
-- Name: marisqueos marisqueos_fk_segmentos; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marisqueos
ADD CONSTRAINT marisqueos_fk_segmentos FOREIGN KEY (segmento_id) REFERENCES public.segmentos(id);
--
-- Name: segmentos segmentos_sustrato_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.segmentos
ADD CONSTRAINT segmentos_sustrato_id_fk FOREIGN KEY (sustrato_id) REFERENCES public.sustratos(id);
--
-- Name: segmentos segmentos_transecta_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.segmentos
ADD CONSTRAINT segmentos_transecta_id_fk FOREIGN KEY (transecta_id) REFERENCES public.transectas(id);
--
-- Name: transectas transectas_campanias_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transectas
ADD CONSTRAINT transectas_campanias_fk FOREIGN KEY (campania_id) REFERENCES public.campanias(id);
--
-- Name: transectas transectas_fk_buzo_personas; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transectas
ADD CONSTRAINT transectas_fk_buzo_personas FOREIGN KEY (buzo_id) REFERENCES public.personas(id);
--
-- Name: transectas transectas_fk_embarcaciones; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transectas
ADD CONSTRAINT transectas_fk_embarcaciones FOREIGN KEY (embarcacion_id) REFERENCES public.embarcaciones(id);
--
-- Name: transectas transectas_fk_planillero_personas; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transectas
ADD CONSTRAINT transectas_fk_planillero_personas FOREIGN KEY (planillero_id) REFERENCES public.personas(id);
--
-- Name: campanias Allow authenticated users to insert into campanias; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated users to insert into campanias" ON public.campanias FOR
INSERT TO authenticated WITH CHECK (true);
--
-- Name: campanias Allow authenticated users to select from campanias; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated users to select from campanias" ON public.campanias FOR
SELECT TO authenticated USING (true);
--
-- Name: transectas Los usuarios pueden leer; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Los usuarios pueden leer" ON public.transectas FOR
SELECT TO authenticated USING (true);
--
-- Name: segmentos Usuarios autenticados pueden actualizar; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Usuarios autenticados pueden actualizar" ON public.segmentos FOR
UPDATE TO authenticated USING (true);
--
-- Name: transectas Usuarios autenticados pueden crear transectas; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Usuarios autenticados pueden crear transectas" ON public.transectas FOR
INSERT TO authenticated WITH CHECK (true);
--
-- Name: embarcaciones Usuarios autenticados pueden editar; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Usuarios autenticados pueden editar" ON public.embarcaciones FOR
UPDATE TO authenticated USING (true);
--
-- Name: personas Usuarios autenticados pueden editar; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Usuarios autenticados pueden editar" ON public.personas FOR
UPDATE TO authenticated USING (true);
--
-- Name: segmentos Usuarios autenticados pueden insertar; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Usuarios autenticados pueden insertar" ON public.segmentos FOR
INSERT TO authenticated WITH CHECK (true);
--
-- Name: embarcaciones Usuarios autenticados pueden insertar embarcaciones; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Usuarios autenticados pueden insertar embarcaciones" ON public.embarcaciones FOR
INSERT TO authenticated WITH CHECK (true);
--
-- Name: cuadrados Usuarios autenticados pueden leer; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Usuarios autenticados pueden leer" ON public.cuadrados FOR
SELECT TO authenticated USING (true);
--
-- Name: marisqueos Usuarios autenticados pueden leer; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Usuarios autenticados pueden leer" ON public.marisqueos FOR
SELECT TO authenticated USING (true);
--
-- Name: muestreos_cuadrados Usuarios autenticados pueden leer; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Usuarios autenticados pueden leer" ON public.muestreos_cuadrados FOR
SELECT TO authenticated USING (true);
--
-- Name: personas Usuarios autenticados pueden leer; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Usuarios autenticados pueden leer" ON public.personas FOR
SELECT TO authenticated USING (true);
--
-- Name: resultados Usuarios autenticados pueden leer; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Usuarios autenticados pueden leer" ON public.resultados FOR
SELECT TO authenticated USING (true);
--
-- Name: segmentos Usuarios autenticados pueden leer; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Usuarios autenticados pueden leer" ON public.segmentos FOR
SELECT TO authenticated USING (true);
--
-- Name: sustratos Usuarios autenticados pueden leer; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Usuarios autenticados pueden leer" ON public.sustratos FOR
SELECT TO authenticated USING (true);
--
-- Name: tallasmarisqueo Usuarios autenticados pueden leer; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Usuarios autenticados pueden leer" ON public.tallasmarisqueo FOR
SELECT TO authenticated USING (true);
--
-- Name: tallasmarisqueo2 Usuarios autenticados pueden leer; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Usuarios autenticados pueden leer" ON public.tallasmarisqueo2 FOR
SELECT TO authenticated USING (true);
--
-- Name: transectas_templates Usuarios autenticados pueden leer; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Usuarios autenticados pueden leer" ON public.transectas_templates FOR
SELECT TO authenticated USING (true);
--
-- Name: embarcaciones Usuarios autenticados pueden leer embarcaciones; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Usuarios autenticados pueden leer embarcaciones" ON public.embarcaciones FOR
SELECT TO authenticated USING (true);
--
-- Name: personas Usuarios autenticados pueden registrar personas; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Usuarios autenticados pueden registrar personas" ON public.personas FOR
INSERT TO authenticated WITH CHECK (true);
--
-- Name: campanias; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.campanias ENABLE ROW LEVEL SECURITY;
--
-- Name: cuadrados; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.cuadrados ENABLE ROW LEVEL SECURITY;
--
-- Name: embarcaciones; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.embarcaciones ENABLE ROW LEVEL SECURITY;
--
-- Name: marisqueos; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.marisqueos ENABLE ROW LEVEL SECURITY;
--
-- Name: muestreos_cuadrados; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.muestreos_cuadrados ENABLE ROW LEVEL SECURITY;
--
-- Name: personas; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
--
-- Name: resultados; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.resultados ENABLE ROW LEVEL SECURITY;
--
-- Name: segmentos; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.segmentos ENABLE ROW LEVEL SECURITY;
--
-- Name: sustratos; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.sustratos ENABLE ROW LEVEL SECURITY;
--
-- Name: tallasmarisqueo; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tallasmarisqueo ENABLE ROW LEVEL SECURITY;
--
-- Name: tallasmarisqueo2; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tallasmarisqueo2 ENABLE ROW LEVEL SECURITY;
--
-- Name: transectas; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.transectas ENABLE ROW LEVEL SECURITY;
--
-- Name: transectas_templates; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.transectas_templates ENABLE ROW LEVEL SECURITY;
--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public
FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO authenticated;
--
-- Name: SEQUENCE campanias_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.campanias_id_seq TO authenticated;
--
-- Name: TABLE campanias; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,
    INSERT,
    DELETE,
    UPDATE ON TABLE public.campanias TO authenticated;
--
-- Name: TABLE cuadrados; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,
    INSERT,
    DELETE,
    UPDATE ON TABLE public.cuadrados TO authenticated;
--
-- Name: SEQUENCE embarcaciones_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.embarcaciones_id_seq TO authenticated;
--
-- Name: TABLE embarcaciones; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,
    INSERT,
    DELETE,
    UPDATE ON TABLE public.embarcaciones TO authenticated;
--
-- Name: TABLE marisqueos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,
    INSERT,
    DELETE,
    UPDATE ON TABLE public.marisqueos TO authenticated;
--
-- Name: TABLE muestreos_cuadrados; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,
    INSERT,
    DELETE,
    UPDATE ON TABLE public.muestreos_cuadrados TO authenticated;
--
-- Name: SEQUENCE personas_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.personas_id_seq TO authenticated;
--
-- Name: TABLE personas; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,
    INSERT,
    DELETE,
    UPDATE ON TABLE public.personas TO authenticated;
--
-- Name: TABLE resultados; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,
    INSERT,
    DELETE,
    UPDATE ON TABLE public.resultados TO authenticated;
--
-- Name: SEQUENCE segmentos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.segmentos_id_seq TO authenticated;
--
-- Name: TABLE segmentos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,
    INSERT,
    DELETE,
    UPDATE ON TABLE public.segmentos TO authenticated;
--
-- Name: TABLE sustratos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,
    INSERT,
    DELETE,
    UPDATE ON TABLE public.sustratos TO authenticated;
--
-- Name: TABLE tallasmarisqueo; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,
    INSERT,
    DELETE,
    UPDATE ON TABLE public.tallasmarisqueo TO authenticated;
--
-- Name: TABLE tallasmarisqueo2; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,
    INSERT,
    DELETE,
    UPDATE ON TABLE public.tallasmarisqueo2 TO authenticated;
--
-- Name: SEQUENCE transectas_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.transectas_id_seq TO authenticated;
--
-- Name: TABLE transectas; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,
    INSERT,
    DELETE,
    UPDATE ON TABLE public.transectas TO authenticated;
--
-- Name: TABLE transectas_templates; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,
    INSERT,
    DELETE,
    UPDATE ON TABLE public.transectas_templates TO authenticated;
--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
GRANT SELECT ON TABLES TO authenticated;
--
-- PostgreSQL database dump complete
--