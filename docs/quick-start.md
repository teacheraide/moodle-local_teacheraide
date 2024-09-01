# Quick Start

## Prerequisite

- [docker](https://www.docker.com/products/docker-desktop)
- git

see https://github.com/moodlehq/moodle-docker?tab=readme-ov-file#quick-start

## Start development with moodle-docker

```bash

git clone git@github.com:moodlehq/moodle-docker.git

cd moodle-docker

# Change ./moodle to your /path/to/moodle if you already have it checked out
export MOODLE_DOCKER_WWWROOT=./moodle

# Choose a db server (Currently supported: pgsql, mariadb, mysql, mssql, oracle)
export MOODLE_DOCKER_DB=pgsql

# Get Moodle code, you could select another version branch (skip this if you already got the code)
git clone -b MOODLE_404_STABLE git://git.moodle.org/moodle.git $MOODLE_DOCKER_WWWROOT

# Ensure customized config.php for the Docker containers is in place
cp config.docker-template.php $MOODLE_DOCKER_WWWROOT/config.php
```

you may want to keep your postgresql volume persistent, and expose the postgresql port, as well as mailpit port

create `local.yml` with content below

```yaml
# local.yml

services:
  db:
    ports:
      - "5432:5432"
    volumes:
      - "db_data:/var/lib/postgresql/data"

  mailpit:
    ports:
      - "8025:8025"

volumes:
  db_data:
    driver: local
```

then run moodle-docker

```bash
# Start up containers
bin/moodle-docker-compose up -d

```

## Clone TeacherAIde plugin

```bash
# Stay inside path/to/moodle-docker/

git clone git@github.com:teacheraide/moodle-local_teacheraide.git "$MOODLE_DOCKER_WWWROOT/local/teacheraide"
bin/moodle-docker-compose exec webserver php admin/cli/upgrade.php
```

go to http://localhost:8000 to complete setup

once logged in as admin, go to Site Administration > Development > Make test course - to generate a course

## Stop moodle-docker

```bash
# Shut down and destroy containers
bin/moodle-docker-compose down
```
