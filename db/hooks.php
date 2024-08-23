<?php
$callbacks = [
  [
    'hook' => core\hook\output\before_standard_head_html_generation::class,
    'callback' => [\local_teacheraide\hook_callbacks::class, 'before_standard_head_html_generation'],
    'priority' => 500,
  ],
  [
    'hook' => core\hook\output\before_footer_html_generation::class,
    'callback' => [\local_teacheraide\hook_callbacks::class, "before_footer_html_generation"],
    'priority' => 500,
  ],
  [
    'hook' => core\hook\output\after_standard_main_region_html_generation::class,
    'callback' => [\local_teacheraide\hook_callbacks::class, 'after_standard_main_region_html_generation'],
    'priority' => 500,
  ],
  [
    'hook' => core\hook\output\before_standard_top_of_body_html_generation::class,
    'callback' => [\local_teacheraide\hook_callbacks::class, 'before_standard_top_of_body_html_generation'],
    'priority' => 500,
  ]
];
