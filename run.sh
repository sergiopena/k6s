#!/usr/bin/env bash

#set -x

# Get first parameter (testsuite)
TESTSuite=$1
DATASPACE=$2

# Check if parameters are provided
if [ -z "$TESTSuite" ]; then
    echo "Error: First parameter (testsuite) is required"
    echo "Usage: $0 <testsuite> [dataspace]"
    exit 1
fi

echo "Testsuite: $TESTSuite"
if [ -n "$DATASPACE" ]; then
    echo "DATASPACE: $DATASPACE"
fi


mkdir logs

#export NSIWS_HOSTNAME='https://nsi-staging-statsuite.dev.aws.fao.org'

export NSIWS_HOSTNAME='https://nsi-'$DATASPACE'-statsuite.dev.aws.fao.org'
export USERNAME='test-admin'
export CLIENT_ID='stat-suite'
export PASSWORD='admin '
export TRANSFER_HOSTNAME='https://transfer-statsuite.dev.aws.fao.org'
#export DATASPACE='staging'
export KEYCLOAK_URL='https://keycloak-statsuite.dev.aws.fao.org/realms/statsuite/protocol/openid-connect/token'
export KEYCLOAK_CLIENT_ID='stat-suite'
export DOCKER_IMAGE='grafana/k6:latest'
export TESTSUITE_START_TIME=$(date +"%Y-%m-%d-%T")


suite=( #"smoke-test-structure-imports"
#"smoke-test-data-imports"
"smoke-test-exports"
#"load-test-data-imports"
#"load-test-exports-fao"
#"soak-test-data-imports"
#"soak-test-exports"
#"spike-test-data-imports"
#"spike-test-exports"
#"stress-test-data-imports"
#"stress-test-exports" 
)

for test in "${suite[@]}";
do
echo "----------------------- Running test: ${test} -----------------------"
echo $(pwd)
docker run -it --network='host' -e NSIWS_HOSTNAME=$NSIWS_HOSTNAME -e USERNAME=$USERNAME \
-e CLIENT_ID=$CLIENT_ID  -e PASSWORD=$PASSWORD -e TRANSFER_SERVICE_HOSTNAME=$TRANSFER_HOSTNAME \
-e DATASPACE=$DATASPACE -e KEYCLOAK_AT_URL=$KEYCLOAK_URL  -e KEYCLOAK_CLIENT_ID=$KEYCLOAK_CLIENT_ID \
-v ./PerformanceTests:/src \
$DOCKER_IMAGE run --tag testid="${test}-${TESTSUITE_START_TIME}" /src/${TESTSuite}/${test}.js | tee -a ./logs/${TESTSuite}-${DATASPACE}-${test}-${TESTSUITE_START_TIME}.log
done
