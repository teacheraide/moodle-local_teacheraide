<?php
$callbacks = [
  [
    'hook' => core\hook\output\before_footer_html_generation::class,
    'callback' => [\local_teacheraide\hook_callbacks::class, 'before_footer_html_generation'],
    'priority' => 500,
  ],
];
