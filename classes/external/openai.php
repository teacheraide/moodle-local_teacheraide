<?php

namespace local_teacheraide\external;

use core\dataformat\base;
use \core_external\external_function_parameters;
use \core_external\external_single_structure;
use \core_external\external_value;
use \core_external\external_api;

defined('MOODLE_INTERNAL') || die();

class openai extends external_api
{
  public static function gateway_parameters()
  {
    return new external_function_parameters(
      array(
        'endpoint' => new external_value(PARAM_TEXT, 'The endpoint to call'),
        'method' => new external_value(PARAM_TEXT, 'The HTTP method to use'),
        'params' => new external_value(PARAM_RAW, 'The parameters to pass to the endpoint', VALUE_OPTIONAL, null)
      )
    );
  }

  public static function gateway($endpoint, $method, $params = null)
  {
    // Validate parameters
    $valid_params = self::validate_parameters(self::gateway_parameters(), array('endpoint' => $endpoint, 'method' => $method, 'params' => $params));

    $request = [
      "endpoint" => $valid_params['endpoint'],
      "method" => $valid_params['method'],
      "params" => $valid_params["params"]
    ];

    // var_dump($request);

    // Get base URL and API key from Moodle settings
    $baseurl = get_config('local_teacheraide', 'api_base_url');
    $apikey = get_config('local_teacheraide', 'api_key');

    // Construct the full URL
    $fullurl = rtrim($baseurl, '/') . '/' . ltrim($request['endpoint'], '/');

    // ob_start();
    // $out = fopen('php://output', 'w');


    // Initialize cURL
    $ch = curl_init();

    // //increase verbosity of curl output
    // curl_setopt($ch, CURLOPT_VERBOSE, 1);

    // //store output in the stream we've initalized
    // curl_setopt($ch, CURLOPT_STDERR, $out);


    curl_setopt($ch, CURLOPT_URL, $fullurl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

    // Set HTTP method
    switch (strtoupper($request['method'])) {
      case 'GET':
        curl_setopt($ch, CURLOPT_HTTPGET, true);
        break;
      case 'POST':
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $request['params']);
        break;
      case 'PUT':
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        curl_setopt($ch, CURLOPT_POSTFIELDS, $request['params']);
        break;
      case 'DELETE':
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
        curl_setopt($ch, CURLOPT_POSTFIELDS, $request['params']);
        break;
      default:
        throw new \invalid_parameter_exception('Unsupported HTTP method: ' . $request['method']);
    }

    // Inject the API key from Moodle settings
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
      'Authorization: Bearer ' . $apikey,
      'Content-Type: application/json'
    ]);

    // var_dump($request['params']);
    // var_dump(curl_getinfo($ch));

    // Execute the request
    $response = curl_exec($ch);
    if (curl_errno($ch)) {
      throw new \moodle_exception('curl_error', 'local_teacheraide', '', curl_error($ch));
    }
    curl_close($ch);

    // fclose($out);

    // var_dump(ob_get_clean());
    // var_dump($response);

    return [
      'data' => $response
    ];
  }

  public static function gateway_returns()
  {
    return new external_single_structure(
      array(
        'data' => new external_value(PARAM_RAW, 'Data returned from the API')
      )
    );
  }
}
