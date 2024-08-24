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
 * Plugin administration pages are defined here.
 *
 * @package     local_teacheraide
 * @category    admin
 * @copyright   2024 Your Name <you@example.com>
 * @license     https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig) {
    $settings = new admin_settingpage('local_teacheraide_settings', get_string('pluginname', 'local_teacheraide'));
    $settingspage = new admin_settingpage('managelocalteacheraide', get_string('manage', 'local_teacheraide'));

    // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedIf
    if ($ADMIN->fulltree) {
        // Define actual plugin settings page and add it to the tree - {@link https://docs.moodle.org/dev/Admin_settings}.
        $settingspage->add(new admin_setting_configtext(
            'local_teacheraide/ai_api_key',
            get_string('ai_api_key', 'local_teacheraide'),
            get_string('ai_api_key_desc', 'local_teacheraide'),
            "",
            PARAM_TEXT,
            50
        ));
    }

    $ADMIN->add('localplugins', $settingspage);
}
