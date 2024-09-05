<?php
$functions = [
  'local_teacheraide_openai_passthrough' => [
    'classname'   => local_teacheraide\external\openai::class,
    'methodname'  => 'passthrough',
    'description' => 'Passthrough to an external API',
    'type'        => 'write',
    'ajax'        => true,
    'loginrequired' => true,
  ],
];

$services = [
  'Teacheraide Service' => [
    'functions' => ['local_teacheraide_openai_passthrough'],
    'restrictedusers' => 0,
    'enabled' => 1,
  ]
];
