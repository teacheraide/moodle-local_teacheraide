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

namespace local_teacheraide\external;

use \core_external\external_function_parameters;
use \core_external\external_single_structure;
use \core_external\external_value;
use \core_external\external_api;

defined('MOODLE_INTERNAL') || die();

class openai extends external_api
{
  public static function passthrough_parameters()
  {
    return new external_function_parameters(
      array(
        'endpoint' => new external_value(PARAM_TEXT, 'The endpoint to call'),
        'method' => new external_value(PARAM_TEXT, 'The HTTP method to use'),
        'params' => new external_value(PARAM_RAW, 'The parameters to pass to the endpoint')
      )
    );
  }

  public static function passthrough($endpoint, $params)
  {
    // Validate parameters
    $params = self::validate_parameters(self::passthrough_parameters(), array('endpoint' => $endpoint, 'params' => $params));

    // Initialize cURL
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $params['endpoint']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    // Set HTTP method
    switch (strtoupper($params['method'])) {
      case 'GET':
        curl_setopt($ch, CURLOPT_HTTPGET, true);
        break;
      case 'POST':
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $params['params']);
        break;
      case 'PUT':
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        curl_setopt($ch, CURLOPT_POSTFIELDS, $params['params']);
        break;
      case 'DELETE':
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
        curl_setopt($ch, CURLOPT_POSTFIELDS, $params['params']);
        break;
      default:
        throw new \invalid_parameter_exception('Unsupported HTTP method: ' . $params['method']);
    }

    // Inject the API key from moodle settings
    $headers = [
      'Authorization: Bearer YOUR_API_KEY_HERE',
      'Content-Type: application/json'
    ];
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    // Execute the request
    $response = curl_exec($ch);
    if (curl_errno($ch)) {
      throw new \moodle_exception('curl_error', 'local_teacheraide', '', curl_error($ch));
    }
    curl_close($ch);

    return json_decode($response, true);
  }

  public static function passthrough_returns()
  {
    return new external_single_structure(
      array(
        'status' => new external_value(PARAM_TEXT, 'Status of the API call'),
        'data' => new external_value(PARAM_RAW, 'Data returned from the API')
      )
    );
  }
}
