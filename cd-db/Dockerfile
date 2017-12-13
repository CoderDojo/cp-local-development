FROM postgres:9-alpine
LABEL maintainer="butlerx <cian@coderdojo.org>"
COPY dumps /db
RUN chown -R postgres:postgres /db
COPY setup_zen.sql   /docker-entrypoint-initdb.d/10-setup_zen.sql
COPY restore_db.sh /docker-entrypoint-initdb.d/20-restore_db.sh
COPY anon_db.sql /docker-entrypoint-initdb.d/30-anon_db.sql
