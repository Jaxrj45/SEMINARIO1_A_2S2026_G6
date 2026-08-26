CREATE ROLE cc_owner LOGIN PASSWORD 'CAMBIAR_PASSWORD_OWNER';
CREATE ROLE cc_app LOGIN PASSWORD 'CAMBIAR_PASSWORD_APP';

GRANT cc_owner TO CURRENT_USER;

CREATE DATABASE cloudcinema OWNER cc_owner ENCODING 'UTF8';

REVOKE ALL ON DATABASE cloudcinema FROM PUBLIC;
GRANT CONNECT ON DATABASE cloudcinema TO cc_owner;
GRANT CONNECT ON DATABASE cloudcinema TO cc_app;

\connect cloudcinema

CREATE SCHEMA IF NOT EXISTS cloudcinema AUTHORIZATION cc_owner;

REVOKE CREATE ON SCHEMA public FROM PUBLIC;

ALTER DATABASE cloudcinema SET search_path = cloudcinema, public;
ALTER ROLE cc_owner IN DATABASE cloudcinema SET search_path = cloudcinema, public;
ALTER ROLE cc_app IN DATABASE cloudcinema SET search_path = cloudcinema, public;

GRANT USAGE ON SCHEMA cloudcinema TO cc_app;

ALTER DEFAULT PRIVILEGES FOR ROLE cc_owner IN SCHEMA cloudcinema
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO cc_app;

ALTER DEFAULT PRIVILEGES FOR ROLE cc_owner IN SCHEMA cloudcinema
    GRANT USAGE, SELECT ON SEQUENCES TO cc_app;
