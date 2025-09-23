/******************
	This test provies scenario for smoke testing a NSI-WS:
		1.- smoke test provides a sanity check every time there are new changes to the NSI-WS.
		2.- Verify that your system doesn't throw any errors when under minimal load.
	
*******************/
import http from 'k6/http';
import { check, sleep, group, fail } from 'k6';
import { initConfig, exportData } from '../utils.js';

let INPUT_FILE = __ENV.TEST_CASES_FILE || "./Resources/test-cases-exports-fao.json";

//Load test cases from json file
const TEST_CASES= JSON.parse(open(INPUT_FILE));
			
export let options = {
	systemTags: ['check','error_code','group','method','name','status'],
	//Base line test 
	//Fixed number of iterations to execute the default function.
	iterations: TEST_CASES.length,
	vus: 1,  // 1 user looping 
	//duration: '1m',
	thresholds: {
		'checks': ['rate>=1.0'], // 100% success rate required
		
        "http_req_duration":   	["avg<498"],//less than 0.498 seconds
        "http_req_duration{group:::Query type structure::Struc type agencyscheme}":   	["avg<1000"],
        "http_req_duration{group:::Query type structure::Struc type categoryscheme}": 	["avg<1000"],
        "http_req_duration{group:::Query type structure::Struc type categorisation}": 	["avg<1000"],
        "http_req_duration{group:::Query type structure::Struc type codelist}":       	["avg<1000"],
        "http_req_duration{group:::Query type structure::Struc type conceptscheme}":  	["avg<1000"],
        "http_req_duration{group:::Query type structure::Struc type contentconstraint}":["avg<1000"],
        "http_req_duration{group:::Query type structure::Struc type dataflow}":       	["avg<5000"],
        "http_req_duration{group:::Query type structure::Struc type datastructure}":  	["avg<5000"],		
        "http_req_duration{group:::Query type structure::Struc type hierarchicalcodelist}": ["avg<1000"],		
        "http_req_duration{group:::Query type structure::Struc type metadataflow}":   	["avg<1000"],	
        "http_req_duration{group:::Query type structure::Struc type metadatastructure}":["avg<1000"],	
        "http_req_duration{group:::Query type structure::Struc type structureset}":   	["avg<1000"],	
				
        "http_req_duration{group:::Query type data::Format xml::Size extraSmall}": 	["avg<2000"],
        "http_req_duration{group:::Query type data::Format xml::Size small}": 		["avg<2000"],
        "http_req_duration{group:::Query type data::Format xml::Size medium}": 		["avg<2000"],
        "http_req_duration{group:::Query type data::Format xml::Size large}": 		["avg<2000"],
        "http_req_duration{group:::Query type data::Format xml::Size extraLarge}": 	["avg<10000"],
		
        "http_req_duration{group:::Query type data::Format json::Size extraSmall}": ["avg<2000"],
        "http_req_duration{group:::Query type data::Format json::Size small}": 		["avg<2000"],
        "http_req_duration{group:::Query type data::Format json::Size medium}": 	["avg<2000"],
        "http_req_duration{group:::Query type data::Format json::Size large}": 		["avg<2000"],
        "http_req_duration{group:::Query type data::Format json::Size extraLarge}": ["avg<10000"],
		
        "http_req_duration{group:::Query type data::Format csv::Size extraSmall}": 	["avg<2000"],
        "http_req_duration{group:::Query type data::Format csv::Size small}": 		["avg<2000"],
        "http_req_duration{group:::Query type data::Format csv::Size medium}": 		["avg<2000"],
        "http_req_duration{group:::Query type data::Format csv::Size large}": 		["avg<2000"],
        "http_req_duration{group:::Query type data::Format csv::Size extraLarge}": 	["avg<10000"],
		
        "http_req_duration{group:::Query type data::Format xml::Size extraSmall_paginated}": 	["avg<2000"],
        "http_req_duration{group:::Query type data::Format xml::Size small_paginated}": 		["avg<2000"],
        "http_req_duration{group:::Query type data::Format xml::Size medium_paginated}": 		["avg<2000"],
        "http_req_duration{group:::Query type data::Format xml::Size large_paginated}": 		["avg<2000"],
        "http_req_duration{group:::Query type data::Format xml::Size extraLarge_paginated}": 	["avg<10000"],
		
        "http_req_duration{group:::Query type data::Format json::Size extraSmall_paginated}": 	["avg<2000"],
        "http_req_duration{group:::Query type data::Format json::Size small_paginated}": 		["avg<2000"],
        "http_req_duration{group:::Query type data::Format json::Size medium_paginated}": 		["avg<2000"],
        "http_req_duration{group:::Query type data::Format json::Size large_paginated}": 		["avg<2000"],
        "http_req_duration{group:::Query type data::Format json::Size extraLarge_paginated}": 	["avg<10000"],
		
        "http_req_duration{group:::Query type data::Format csv::Size extraSmall_paginated}": 	["avg<2000"],
        "http_req_duration{group:::Query type data::Format csv::Size small_paginated}": 		["avg<2000"],
        "http_req_duration{group:::Query type data::Format csv::Size medium_paginated}": 		["avg<2000"],
        "http_req_duration{group:::Query type data::Format csv::Size large_paginated}": 		["avg<2000"],
        "http_req_duration{group:::Query type data::Format csv::Size extraLarge_paginated}": 	["avg<10000"],
		
        "http_req_duration{datasetSize:extraSmall}":["avg<277"],//less than 0.277 seconds
        "http_req_duration{datasetSize:small}": 	["avg<331"],//less than 0.331 seconds
        "http_req_duration{datasetSize:medium}": 	["avg<2000"],
        "http_req_duration{datasetSize:large}": 	["avg<10000"],
        "http_req_duration{datasetSize:extraLarge}":["avg<10000"],
		
        "http_req_duration{datasetSize:extraSmall_paginated}":["avg<2000"],
        "http_req_duration{datasetSize:small_paginated}":     ["avg<2000"],
        "http_req_duration{datasetSize:medium_paginated}": 	  ["avg<2000"],
        "http_req_duration{datasetSize:large_paginated}": 	  ["avg<10000"],
        "http_req_duration{datasetSize:extraLarge_paginated}":["avg<10000"],
	},	
	//Discard the response bodies to lessen the amount of memmory required by the testing machine.
	discardResponseBodies: true
};

export function setup() {
	return initConfig(true);
}

export default function(config) {

	let testQuery = TEST_CASES[__ITER];
	
	exportData(config, testQuery, false);
}
