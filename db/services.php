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

$functions = [
  'local_teacheraide_openai_gateway' => [
    'classname'   => local_teacheraide\external\openai::class,
    'methodname'  => 'gateway',
    'description' => 'Gateway to an external openai API',
    'type'        => 'write',
    'ajax'        => true,
    'loginrequired' => true,
  ],
];

$services = [
  'Teacheraide Service' => [
    'functions' => ['local_teacheraide_openai_gateway'],
    'restrictedusers' => 0,
    'enabled' => 1,
  ],
];
