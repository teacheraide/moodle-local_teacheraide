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

# Start up containers
bin/moodle-docker-compose up -d

```

## Clone TeacherAIde plugin

```bash
# Stay inside path/to/moodle-docker/

git clone git@github.com:teacheraide/moodle-local_teacheraide.git "$MOODLE_DOCKER_WWWROOT/local/teacheraide"
bin/moodle-docker-compose exec webserver php admin/cli/upgrade.php
```

## Start widget development (WIP)

## Stop moodle-docker

```bash
# Shut down and destroy containers
bin/moodle-docker-compose down
```
