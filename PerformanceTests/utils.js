import http from 'k6/http';
import { check, sleep, group, fail } from 'k6';

export function initConfig(isNSI)
{
	let config = {
		accessToken:'',
		expiry:'',
		tokenUrl:__ENV.KEYCLOAK_AT_URL,
		clientId:__ENV.KEYCLOAK_CLIENT_ID || "app",
		username:__ENV.USERNAME,
		password:__ENV.PASSWORD,
		dataspace:__ENV.TRANSFER_SERVICE_DATASPACE || "stable",
		transferBaseUrl:__ENV.TRANSFER_SERVICE_HOSTNAME || "http://127.0.0.1:93",
		nsiBaseUrl:__ENV.NSIWS_HOSTNAME || "http://127.0.0.1:81"
	};
	
	let baseUrl = isNSI ? config.nsiBaseUrl : config.transferBaseUrl;
	var params = { 
		responseType: "text",
		tags:{name:'healthProbe'}
	};
	
	let healthCheck = http.get(`${baseUrl}/health`, params);
	
	if (healthCheck.status !== 200)
	{
		fail(`Error: the Service with URL {${healthCheck.request.url} is not responding.`);
	}
		
	console.log(`Testing {${baseUrl}} service, version ${healthCheck.json().service.details.version}`);
	
	return config;
}

export function importData(config, testCase, importRate, importTrend)
{
	//Submit data import requests
	let params =
	{
		headers : {
			'Accept':'application/json',
			'Authorization': `Bearer ${config.accessToken}`, 
		},
		tags:{name:'dataImport'}
	};
		
	var method = "/1.2/import/sdmxFile";
	let data= {	'dataspace': config.dataspace, 'sendEmail': 1};
	
	//Import from SDMX source
	if(testCase.format ==="sdmx" ){
		data.filepath= testCase.sdmxSource;
		//Workaround - K6 only supports multipart/from-data request if there is a file in the request. 
		data.file= http.file("", "dummyFile.csv");
		console.log(`Importing from url: ${data.filepath}`);
	}
	//Import from Excel
	else if(testCase.format ==="excel" ){
		method = "/1.2/import/excel";
		data.eddFile  = http.file(testCase.edd, testCase.eddFile);
		data.excelFile = http.file(testCase.data, testCase.dataFile);
		console.log(`Importing excel file: ${testCase.eddFile}`);
	}
	//Import from CSV and XML
	else{
		data.file = http.file(testCase.data, testCase.dataFile);
		console.log(`Importing from file: ${testCase.dataFile}`);
	}
	
	var res = http.post(
		`${config.transferBaseUrl}${method}`, 
		data, 
		params,
	);
	sleep(1);//1s

	console.log(`import status:${res.status}`);
	
	check(res, {
		'is status 200': (r) => r.status === 200
	});
	
	var date = new Date();
	var startTime =  date.getTime();
	
	if(res.status ==200){
		
		var jsonResp = res.json();
		
		console.log(`import message:${jsonResp.message}`);
		
		var transactionID = jsonResp.message.match(/\d+/g);
				
		//Wait for the transfer-service to process import
		
		if(testCase.size=="extraSmall")
			sleep(2);//2s
		else if(testCase.size=="small")
			sleep(5);//4s
		else if(testCase.size=="medium")
			sleep(20);//20s
		else if(testCase.size=="large")
			sleep(20);//20s
		else if(testCase.size=="extraLarge")
			sleep(20);//20s
		else
			sleep(10);//10s
		 
		var timeOutTime = 600000;//10min
		do{
			//Get new access token if current token has expired
			TryToGetNewAccessToken(config);
			
			let data= { 
				'dataspace': config.dataspace,	
				'id': parseInt(transactionID)
			};
			
			params =
			{
				headers : {
					'Accept':'application/json',
					'Authorization': `Bearer ${config.accessToken}`, 
				},
				tags:{name:'statusCheck'}
			};
						
			method = "/1.2/status/request";
			var res = http.post(
				`${config.transferBaseUrl}${method}`,
				data, 
				params
			);
			sleep(1);//1s
			
		    var d = new Date();
			if(res.status===200){
				
				var jsonResp = res.json();
				
				if(jsonResp.outcome==="Success" || jsonResp.outcome==="Warning"){
					var actualTime = Date.parse(jsonResp.executionEnd) - Date.parse(jsonResp.executionStart);					
					if(Number.isNaN(actualTime) || actualTime <= 0){
						console.log(`Bad Import time:${actualTime}`);
						importRate.add(false);
					}else{
						console.log(`Transaction ID: ${transactionID}, Status: ${jsonResp.outcome}, Import time:${actualTime}`);
						importTrend.add(actualTime, { import_type: `${testCase.format}_${testCase.size}` });
						importTrend.add(actualTime, { datasetSize: `${testCase.datasetSize}` });
						//The import was completed
						importRate.add(true);
					}
					break;
				}
				else if(jsonResp.outcome==="Error" || jsonResp.executionStatus==="TimedOut" || jsonResp.executionStatus==="Canceled"){
					//The import completed with errors
					importRate.add(false);
					console.log(`Transaction ID: ${transactionID} - Execution Status: ${jsonResp.outcome}/${jsonResp.executionStatus}`);
					break;
				}
				else if(d.getTime()-startTime>=timeOutTime){
					//The import was TimedOut
					importRate.add(false);
					console.log(`timed out ${transactionID}`);
					break;
				}
			}
			sleep(10);//5s
		}while(true);
		
	}
	else{
		importRate.add(false);
		
		if(res.status >= 500){
			console.log(`import message:${res.body}`);
		}
	}
}

const SUPPORTED_RESPONSE_FORMATS =["csv", "json"];

export function exportData(config, testQuery, isRandom)
{
	TryToGetNewAccessToken(config);
	
	let params = 
	{ 
		headers: {
			'Accept-Ecoding': 'gzip, deflate',
			'Authorization': `Bearer ${config.accessToken}`
		}
	};
	
	group(`Query type ${testQuery.queryType}`, function (){
		
		//structure query			
		if(testQuery.queryType==="structure"){
			
			params.headers.Accept = 'application/vnd.sdmx.structure+json; version=1.0; charset=utf-8';
			params.tags={name:'nsiStructureQuery'};
			
			group(`Struc type ${testQuery.structureType}`, function (){
				let response = http.get(
					`${config.nsiBaseUrl}${testQuery.query}`, //URL
					params, //headers 
				);	
							
				check(response, {
					"status is 200": (r) => r.status == 200
				});
			});
		}			
		//data query
		else
		{
			var randomIndex = Math.floor(Math.random() * SUPPORTED_RESPONSE_FORMATS.length);
			
			let formatsToQuery = isRandom 
				? SUPPORTED_RESPONSE_FORMATS.slice(randomIndex, randomIndex+1)
				: SUPPORTED_RESPONSE_FORMATS;
							
			for(let i in formatsToQuery)
			{								
				let responseFormat = formatsToQuery[i];
								
				params.headers.Accept=`application/vnd.sdmx.data+${responseFormat}`;
				
				if(responseFormat==="xml")
					params.headers.Accept=`application/vnd.sdmx.genericdata+${responseFormat}`;
				
				var expectedResponseStatusCode = 200;
				//has range headers
				if ('range' in testQuery) {
					params.headers.Range=testQuery.range;
					expectedResponseStatusCode = 200;//partial content
				}
				
				//add tags
				params.tags={datasetSize:testQuery.datasetSize, name:'nsiDataQuery'};
				
				group(`Format ${responseFormat}`, function (){
					group(`Size ${testQuery.responseSize}`, function (){
						let response = http.get(
							`${config.nsiBaseUrl}${testQuery.query}`, //URL
							params, //headers 
						);													
						var msg= `status is ${expectedResponseStatusCode}`;
						check(response, {
							msg: (r) => r.status == expectedResponseStatusCode
						});
						
						if(response.status !=expectedResponseStatusCode){
							console.log(`Failed request - Status: ${response.status} Query: ${testQuery.query}`);	
						}
					});
				});				
			}
		}
	});
}

export function TryToGetNewAccessToken(config){
	
	if(!config.tokenUrl || !config.username || !config.password)
		return;
	
	if(config.accessToken && config.expiry > new Date().getTime())
		return;
	        
	let data= { 
		'grant_type': "password",
		'client_id': config.clientId, 
		'scope': "openid", 
		'username': config.username,
		'password': config.password
	};
			
	//Get new access token
	var params = {
		headers: {'Accept':'application/json'}, 
		responseType: "text",
		tags:{name:'tokenUrl'}
	};
	let res = http.post(config.tokenUrl, data, params);
	var responseJson = res.json();
	
	var expiryDate = new Date();
	expiryDate.setSeconds(expiryDate.getSeconds() + responseJson.expires_in);
	
	config.expiry = expiryDate.getTime();
	config.accessToken = responseJson.access_token;
}