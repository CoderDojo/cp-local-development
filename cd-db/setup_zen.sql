-- Until the SUPERUSER role is removed from dumps
CREATE ROLE d8jnawwrcw7sp9 SUPERUSER;
-- END
-- Dojos DB requires some extensions
CREATE EXTENSION cube;
CREATE EXTENSION earthdistance;
-- END
create user platform with superuser password 'QdYx3D5y';
CREATE DATABASE "cp-dojos-development" OWNER platform;
CREATE DATABASE "cp-users-development" OWNER platform;
CREATE DATABASE "cp-events-development" OWNER platform;
