#!/usr/bin/env bash

#set -x

# Get first parameter (testsuite)
TESTSuite=$1

# Second parameter (dataspace) overrides DATASPACE from .env
if [ -n "$2" ]; then
    export DATASPACE=$2
fi

# Load common configuration
set -a
source "$(dirname "$0")/.env"
set +a

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

export TESTSUITE_START_TIME=$(date +"%Y-%m-%d-%T")


suite=( 
#"smoke-test-exports"
"load-test-exports"
)

for test in "${suite[@]}";
do
echo "----------------------- Running test: ${test} -----------------------"
echo $(pwd)
docker run -it --network='host' -e NSIWS_HOSTNAME=$NSI_URL -e USERNAME=$KEYCLOAK_USER \
-e CLIENT_ID=$KEYCLOAK_CLIENT_ID  -e PASSWORD=$KEYCLOAK_PASSWORD -e TRANSFER_SERVICE_HOSTNAME=$TRANSFER_URL \
-e DATASPACE=$DATASPACE -e KEYCLOAK_AT_URL=$KEYCLOAK_TOKEN_URL  -e KEYCLOAK_CLIENT_ID=$KEYCLOAK_CLIENT_ID \
-v ./PerformanceTests:/src \
$DOCKER_IMAGE run --tag testid="${test}-${TESTSUITE_START_TIME}" /src/${TESTSuite}/${test}.js | tee -a ./logs/${TESTSuite}-${DATASPACE}-${test}-${TESTSUITE_START_TIME}.log
done
