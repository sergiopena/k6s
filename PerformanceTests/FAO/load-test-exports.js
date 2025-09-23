/******************
	This test provies scenario for load testing a NSI-WS:
		1.- Assess the current performance of the NSI-WS under typical and peak load.
		2.- Make sure that the NSI-WS is continuously meeting the performance standards as changes are made to the system (code and infrastructure).
	
*******************/
import http from 'k6/http';
import { check, sleep, group, fail } from 'k6';
import { initConfig, exportData } from './Resources/utils.js';

let INPUT_FILE = __ENV.TEST_CASES_FILE || "./Resources/test-cases-exports-fao.json";

//Load test cases from json file
const TEST_CASES= JSON.parse(open(INPUT_FILE));
	
export let options = {
	systemTags: ['check','error_code','group','method','name','status'],
	//Target = number of max users to scale to
	stages: [
		{ duration: '2m', target: 40 }, // simulate ramp-up of traffic from 1 to 40 users over 2 minutes.
		{ duration: '4m', target: 40 }, // stay at 40 users for 4 minutes
		{ duration: '1m', target: 100 }, // ramp-up to 100 users over 1 minutes (peak hour starts)
		{ duration: '40s', target: 100 }, // stay at 100 users for short amount of time (peak hour)
		{ duration: '1m', target: 40 }, // ramp-down to 40 users over 1 minutes (peak hour ends)
		{ duration: '4m', target: 40 }, // continue at 40 for additional 4 minutes
		{ duration: '2m', target: 0 }, // ramp-down to 0 users
	],
	thresholds: {
		'checks': ['rate>0.99'], // more than 99% success rate
		
        "http_req_duration{group:::Query type structure::Struc type agencyscheme}":   	["avg<1000"],
        "http_req_duration{group:::Query type structure::Struc type categoryscheme}": 	["avg<1000"],
        "http_req_duration{group:::Query type structure::Struc type categorisation}": 	["avg<1000"],
        "http_req_duration{group:::Query type structure::Struc type codelist}":       	["avg<1000"],
        "http_req_duration{group:::Query type structure::Struc type conceptscheme}":  	["avg<1000"],
        "http_req_duration{group:::Query type structure::Struc type contentconstraint}":["avg<1000"],
        "http_req_duration{group:::Query type structure::Struc type dataflow}":       	["avg<60000"],
        "http_req_duration{group:::Query type structure::Struc type datastructure}":  	["avg<60000"],		
        "http_req_duration{group:::Query type structure::Struc type hierarchicalcodelist}": ["avg<1000"],		
        "http_req_duration{group:::Query type structure::Struc type metadataflow}":   	["avg<1000"],	
        "http_req_duration{group:::Query type structure::Struc type metadatastructure}":["avg<1000"],	
        "http_req_duration{group:::Query type structure::Struc type structureset}":   	["avg<1000"],	
				
        "http_req_duration{group:::Query type data::Format xml::Size extraSmall}": 	["avg<35000"],
        "http_req_duration{group:::Query type data::Format xml::Size small}": 		["avg<45000"],
        "http_req_duration{group:::Query type data::Format xml::Size medium}": 		["avg<50000"],
        "http_req_duration{group:::Query type data::Format xml::Size large}": 		["avg<50000"],
        "http_req_duration{group:::Query type data::Format xml::Size extraLarge}": 	["avg<65000"],
		
        "http_req_duration{group:::Query type data::Format json::Size extraSmall}": ["avg<35000"],
        "http_req_duration{group:::Query type data::Format json::Size small}": 		["avg<45000"],
        "http_req_duration{group:::Query type data::Format json::Size medium}": 	["avg<50000"],
        "http_req_duration{group:::Query type data::Format json::Size large}": 		["avg<50000"],
        "http_req_duration{group:::Query type data::Format json::Size extraLarge}": ["avg<65000"],
		
        "http_req_duration{group:::Query type data::Format csv::Size extraSmall}": 	["avg<35000"],
        "http_req_duration{group:::Query type data::Format csv::Size small}": 		["avg<45000"],
        "http_req_duration{group:::Query type data::Format csv::Size medium}": 		["avg<50000"],
        "http_req_duration{group:::Query type data::Format csv::Size large}": 		["avg<50000"],
        "http_req_duration{group:::Query type data::Format csv::Size extraLarge}": 	["avg<65000"],
		
        "http_req_duration{group:::Query type data::Format xml::Size extraSmall_paginated}": 	["avg<40000"],
        "http_req_duration{group:::Query type data::Format xml::Size small_paginated}": 		["avg<40000"],
        "http_req_duration{group:::Query type data::Format xml::Size medium_paginated}": 		["avg<45000"],
        "http_req_duration{group:::Query type data::Format xml::Size large_paginated}": 		["avg<45000"],
        "http_req_duration{group:::Query type data::Format xml::Size extraLarge_paginated}": 	["avg<65000"],
		
        "http_req_duration{group:::Query type data::Format json::Size extraSmall_paginated}":   ["avg<45000"],
        "http_req_duration{group:::Query type data::Format json::Size small_paginated}": 		["avg<45000"],
        "http_req_duration{group:::Query type data::Format json::Size medium_paginated}": 	    ["avg<55000"],
        "http_req_duration{group:::Query type data::Format json::Size large_paginated}": 		["avg<55000"],
        "http_req_duration{group:::Query type data::Format json::Size extraLarge_paginated}":   ["avg<65000"],
		
        "http_req_duration{group:::Query type data::Format csv::Size extraSmall_paginated}": 	["avg<40000"],
        "http_req_duration{group:::Query type data::Format csv::Size small_paginated}": 		["avg<40000"],
        "http_req_duration{group:::Query type data::Format csv::Size medium_paginated}": 		["avg<40000"],
        "http_req_duration{group:::Query type data::Format csv::Size large_paginated}": 		["avg<40000"],
        "http_req_duration{group:::Query type data::Format csv::Size extraLarge_paginated}": 	["avg<50000"],
		
        "http_req_duration{datasetSize:extraSmall}":["avg<30000"],
        "http_req_duration{datasetSize:small}": 	["avg<30000"],
        "http_req_duration{datasetSize:medium}": 	["avg<35000"],
        "http_req_duration{datasetSize:large}": 	["avg<40000"],
        "http_req_duration{datasetSize:extraLarge}":["avg<65000"],
		
        "http_req_duration{datasetSize:extraSmall_paginated}":["avg<30000"],
        "http_req_duration{datasetSize:small_paginated}": 	  ["avg<30000"],
        "http_req_duration{datasetSize:medium_paginated}": 	  ["avg<35000"],
        "http_req_duration{datasetSize:large_paginated}": 	  ["avg<40000"],
        "http_req_duration{datasetSize:extraLarge_paginated}":["avg<65000"],	
	},	
	//Discard the response bodies to lessen the amount of memmory required by the testing machine.
	discardResponseBodies: true,

};

export function setup() {
	return initConfig(true);
}

export default function(config) {

	let testQuery = TEST_CASES[Math.floor(Math.random() * TEST_CASES.length)];
	
	exportData(config, testQuery, true);
}
