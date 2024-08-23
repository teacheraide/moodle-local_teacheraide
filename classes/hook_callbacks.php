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

namespace local_teacheraide;

use \core\hook\output\before_footer_html_generation;
use \core\hook\output\before_standard_top_of_body_html_generation;
use \core\hook\output\after_standard_main_region_html_generation;
use \core\hook\output\before_standard_head_html_generation;

class hook_callbacks
{
  public static function before_standard_head_html_generation(before_standard_head_html_generation $hook): void
  {
    global $PAGE;
    $PAGE->requires->js_call_amd('local_teacheraide/app-lazy', 'init', [[
      'courseid' => "hello",
      'categoryid' => "world",
    ]]);
  }
  public static function before_footer_html_generation(before_footer_html_generation $hook): void {}

  public static function after_standard_main_region_html_generation(after_standard_main_region_html_generation $hook): void
  {

    $hook->add_html($hook->renderer->render_from_template('local_teacheraide/test', [
      'courseid' => "hello",
      'categoryid' => "world",
    ]));
  }

  public static function before_standard_top_of_body_html_generation(before_standard_top_of_body_html_generation $hook): void {}
}
