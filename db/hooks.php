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
 * Plugin strings are defined here.
 *
 * @package     local_teacheraide
 * @category    string
 * @copyright   2024 teacheraide
 * @license     https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$callbacks = [
  [
    'hook' => \core\hook\output\before_standard_head_html_generation::class,
    'callback' => [\local_teacheraide\hook_callbacks::class, 'before_standard_head_html_generation'],
    'priority' => 500,
  ],
  [
    'hook' => \core\hook\output\before_footer_html_generation::class,
    'callback' => [\local_teacheraide\hook_callbacks::class, "before_footer_html_generation"],
    'priority' => 500,
  ],
  [
    'hook' => \core\hook\output\after_standard_main_region_html_generation::class,
    'callback' => [\local_teacheraide\hook_callbacks::class, 'after_standard_main_region_html_generation'],
    'priority' => 500,
  ],
  [
    'hook' => \core\hook\output\before_standard_top_of_body_html_generation::class,
    'callback' => [\local_teacheraide\hook_callbacks::class, 'before_standard_top_of_body_html_generation'],
    'priority' => 500,
  ],
];
