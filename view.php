<?php
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Plugin version and other meta-data are defined here.
 *
 * @package     local_teacheraide
 * @copyright   2024 teacheraide
 * @license     https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require(__DIR__ . '/../../config.php');

use core\context\system;

global $SITE, $PAGE, $OUTPUT;

$PAGE->set_pagetype('site-index');
$context = system::instance();
$PAGE->set_context($context);
$PAGE->set_pagelayout('standard');

$PAGE->set_title($SITE->fullname . ': ' . get_string('pluginname', 'local_teacheraide'));
$PAGE->set_url(new moodle_url('/local/teacheraide/view.php'));

$PAGE->navbar->add(get_string('pluginname', 'local_teacheraide'), new moodle_url('/local/teacheraide/view.php'));

require_login();

echo $OUTPUT->header();

echo $OUTPUT->box_start();
echo $OUTPUT->render_from_template('local_teacheraide/fullpage', [
  'msg' => "Hello World Full Page",
]);
echo $OUTPUT->box_end();
echo $OUTPUT->footer();
