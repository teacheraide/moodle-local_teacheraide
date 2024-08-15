# Quick Start

## Prerequisite

- [docker](https://www.docker.com/products/docker-desktop)

## Start Moodle and supporting services

```bash
docker compose up -d
```

- moodle - http://localhost:8080
- mailcatcher - http://localhost:1080
- postgresql - localhost:5432

username: `user`
passowrd: `bitnami`

# Plugin Development (WIP)

```bash
docker compose up -d
```

after first run, docker compose will start a postgresql, bitnami/moodle will install moodle, you will then see all the moodle files appear in your local `./rootfs/bitnami/moodle` folder

wait until moodle is available in `http://localhost:8080`

copy `.env.sample` to `.env`, then `docker compose up` again

```bash
cp .env.sample .env
docker compose up -d
```

you can then start edit the files inside `./local_teacheraide` folder

## More notes (WIP)

opcache is disabled

# Widget Development (WIP)

## Prerequisite

- [volta](https://docs.volta.sh/guide/getting-started)

### Modify moodle to diable JS cache

find the config file in `./rootfs/bitnami/moodle/config.php`

add the following lines before `/lib/setup.php` line

```php
$CFG->debugdisplay = 1;
$CFG->passwordpolicy = 0;
$CFG->perfdebug = 15;
$CFG->debugpageinfo = 1;
$CFG->allowthemechangeonurl = 1;
$CFG->cachejs = 0;
$CFG->yuicomboloading = 0;
```

### Build JS (WIP)

this project uses volta to lock node and npm versions

```
npm i
```

---

---

## Installing via uploaded ZIP file

1. Log in to your Moodle site as an admin and go to _Site administration >
   Plugins > Install plugins_.
2. Upload the ZIP file with the plugin code. You should only be prompted to add
   extra details if your plugin type is not automatically detected.
3. Check the plugin validation report and finish the installation.

## Installing manually

The plugin can be also installed by putting the contents of this directory to

    {your/moodle/dirroot}/local/teacheraide

Afterwards, log in to your Moodle site as an admin and go to _Site administration >
Notifications_ to complete the installation.

Alternatively, you can run

    $ php admin/cli/upgrade.php

to complete the installation from the command line.

## License

2024 Your Name <you@example.com>

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU General Public License as published by the Free Software
Foundation, either version 3 of the License, or (at your option) any later
version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with
this program. If not, see <https://www.gnu.org/licenses/>.
