<?php
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
  ]
];
