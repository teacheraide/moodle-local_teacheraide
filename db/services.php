<?php

$functions = [
  'local_teacheraide_openai_passthrough' => [
    'classname'   => \local_teacheraide\external\openai::class,
    'methodname'  => 'passthrough',
    'description' => 'Passthrough to OpenAI API v1',
    'type'        => 'write',
    'ajax'        => true,
    // 'loginrequired' => true,
    'services' => []
  ],
];

$services = [
  'TeacherAIde openai passthrough service' => [
    'functions' => ['local_teacheraide_openai_passthrough'],
    'restrictedusers' => 0,
    'enabled' => 1,
  ]
];
