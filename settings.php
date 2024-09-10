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
        // $settingspage->add(new admin_setting_configtext(
        //     'local_teacheraide/api_endpoint',
        //     get_string('api_endpoint', 'local_teacheraide'),
        //     get_string('api_endpoint_desc', 'local_teacheraide'),
        //     // "https://teacheraide-demo-eastus.openai.azure.com",
        //     "http://127.0.0.1:11434",
        //     PARAM_TEXT,
        //     50
        // ));

        $settingspage->add(new admin_setting_configtext(
            'local_teacheraide/api_base_url',
            get_string('api_base_url', 'local_teacheraide'),
            get_string('api_base_url_desc', 'local_teacheraide'),
            // "https://teacheraide-demo-eastus.openai.azure.com",
            // "http://127.0.0.1:11434/v1",
            "http://host.docker.internal:11434/v1",
            PARAM_TEXT,
            50
        ));

        $settingspage->add(new admin_setting_configpasswordunmask(
            'local_teacheraide/api_key',
            get_string('api_key', 'local_teacheraide'),
            get_string('api_key_desc', 'local_teacheraide'),
            "YOUR_API_KEY",
        ));

        // $settingspage->add(new admin_setting_configtext(
        //     'local_teacheraide/api_version',
        //     get_string('api_version', 'local_teacheraide'),
        //     get_string('api_version_desc', 'local_teacheraide'),
        //     "2024-02-15-preview",
        //     PARAM_TEXT,
        //     50
        // ));

        // $settingspage->add(new admin_setting_configtext(
        //     'local_teacheraide/api_deployment',
        //     get_string('api_deployment', 'local_teacheraide'),
        //     get_string('api_deployment_desc', 'local_teacheraide'),
        //     "llama3.1",
        //     PARAM_TEXT,
        //     50
        // ));

        // $settingspage->add(new admin_setting_configtext(
        //     'local_teacheraide/api_model',
        //     get_string('api_model', 'local_teacheraide'),
        //     get_string('api_model_desc', 'local_teacheraide'),
        //     "llama3.1",
        //     PARAM_TEXT,
        //     50
        // ));

        $settingspage->add(new admin_setting_configtext(
            'local_teacheraide/system_prompt',
            get_string('system_prompt', 'local_teacheraide'),
            get_string('system_prompt_desc', 'local_teacheraide'),
            "You are a helpful assistant that aids teachers.",
            PARAM_TEXT,
            50
        ));
    }

    $ADMIN->add('localplugins', $settingspage);
}
