<?php
// This file is part of Moodle - http://moodle.org/
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
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Plugin functions for the local_[pluginname] plugin.
 *
 * @package   local_teacheraide
 * @copyright Year, You Name <your@email.address>
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// defined('MOODLE_INTERNAL') || die();

// require_once(__DIR__ . '/../../config.php');

// $PAGE->requires->js_call_amd('local_teacheraide/app-lazy', 'init', [[
//   'courseid' => "hello",
//   'categoryid' => "world",
// ]]);

function local_teacheraide_js()
{
  global $PAGE;
  $PAGE->requires->js_call_amd('local_teacheraide/app-lazy', 'init', [[
    'courseid' => "hello",
    'categoryid' => "world",
  ]]);
}

function local_teacheraide_before_footer()
{
  local_teacheraide_js();
}
