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

namespace local_teacheraide\external;

use core\dataformat\base;
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_value;
use core_external\external_api;

/**
 * Plugin strings are defined here.
 *
 * @package     local_teacheraide
 * @category    string
 * @copyright   2024 teacheraide
 * @license     https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

class openai extends external_api
{

  public static function gateway_parameters()
  {
    return new external_function_parameters(
      [
        'endpoint' => new external_value(PARAM_TEXT, 'The endpoint to call'),
        'method' => new external_value(PARAM_TEXT, 'The HTTP method to use'),
        'params' => new external_value(PARAM_RAW, 'The parameters to pass to the endpoint', VALUE_OPTIONAL, null),
      ]
    );
  }

  public static function gateway($endpoint, $method, $params = null)
  {
    // Validate parameters
    $validparams = self::validate_parameters(self::gateway_parameters(), ['endpoint' => $endpoint, 'method' => $method, 'params' => $params]);

    $request = [
      "endpoint" => $validparams['endpoint'],
      "method" => $validparams['method'],
      "params" => $validparams["params"],
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
      'Content-Type: application/json',
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
      'data' => $response,
    ];
  }

  public static function gateway_returns()
  {
    return new external_single_structure(
      [
        'data' => new external_value(PARAM_RAW, 'Data returned from the API'),
      ]
    );
  }
}
