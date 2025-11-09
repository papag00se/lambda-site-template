set -eu
source ~/.bash_profile

# RUN LOCALLY WITH:
# DEPLOYABLE=lambda.site.template LOCAL=true AWS_PROFILE=papagoose ./deployment/main.sh

# SETUP VARS
if [[ -z ${LOCAL:-} ]]; then
    # GITHUB_CONTEXT
    export BRANCH=$(jq -jr '.ref_name' <<< "${GITHUB_CONTEXT}")
    export DEPLOYABLE=$(jq -jr '.event.repository.name' <<< "${GITHUB_CONTEXT}")
    export REPOSITORY=$(jq -jr '.repository' <<< "${GITHUB_CONTEXT}")
    # SECRETS_CONTEXT
    export AWS_ACCESS_KEY_ID=$(jq -jr '.AWS_ACCESS_KEY_ID' <<< "${SECRETS_CONTEXT}")
    export AWS_SECRET_ACCESS_KEY=$(jq -jr '.AWS_SECRET_ACCESS_KEY' <<< "${SECRETS_CONTEXT}")
    export GITHUB_TOKEN=$(jq -jr '.github_token' <<< "${SECRETS_CONTEXT}")
else
    export BRANCH=dev
    export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
    export AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
    export SECRETS_CONTEXT='{"x":"y"}'
    rm -rf frontend/dist/
    rm -rf backend/dist/
fi

echo "AWSCLI Version is $(aws --version)" 
export AWS_DEFAULT_REGION=us-east-1
export DEPLOY_ENV=${DEPLOY_ENV:-$BRANCH}
export AWS_PROFILE=${AWS_PROFILE:-default}
export VERSION=${VERSION:-$BRANCH}
SEC_STRIP_NAMES_RX="^${BRANCH}_|ENV_"
FILTER_ENV_VARS_RX="^${BRANCH}_ENV_|^ENV_"
echo "TROUBLESHOOT - ${SEC_STRIP_NAMES_RX} - ${FILTER_ENV_VARS_RX}"
export SECRETS_ENV=$(jq -jr --arg stripnames "${SEC_STRIP_NAMES_RX:-}" --arg filterrx "${FILTER_ENV_VARS_RX:-}" 'with_entries( select(.key | test("^ENV_|_ENV_")) | select(.key | test($filterrx))) | to_entries | sort_by(.key) | map( "\(.key | gsub($stripnames;""))='\''\(.value|tostring)'\'' " ) |.[]' <<< "${SECRETS_CONTEXT}")

if [ "${BRANCH}" = "main" ]; then
    export NODE_ENV=production
else
    export NODE_ENV=development
fi

# INSTALL NODE IF SET
if [[ -n "${NODE_VERSION}" ]]; then
    nvm install ${NODE_VERSION}
    nvm use ${NODE_VERSION}
    echo "NodeJS Version is $(node -v)"
fi

# PRE-DEPLOY
if [ -f ./pre_deploy.sh ]; then
    echo "Found pre_deploy. Running..."
    chmod +x ./pre_deploy.sh && ./pre_deploy.sh
fi

if [ ! -f ./package-lock.json ]; then
    echo "ERROR: package-lock.json is missing!"
    exit 1
fi

export DEPLOY_SITE_NAME=$(echo $DEPLOYABLE | sed 's/\./-/g')
ORIGINAL_NODE_ENV=$NODE_ENV
NODE_ENV=development # This is needed to npm run build build correctly
npm install --silent 1> /dev/null
mkdir -p frontend/dist/
mkdir -p backend/dist/

##################################
echo "STEP 1 - BUILD FRONTEND"
##################################

if [[ -z ${FINGERPRINT:-} ]]; then
    # 1. Create unique fingerprint for this deployment as an automatic cachebuster
    export FINGERPRINT=$(date +%s | sha256sum | base64 | head -c30)
    echo "FINGERPRINT is $FINGERPRINT"
fi

# 2. Build command
if npm run | grep -q "build:frontend"; then
    npm run build:frontend
else
    ROLLUP_ENTRY_IS_JS=${ROLLUP_ENTRY_IS_JS:-false} SITE_DOMAIN=$DEPLOYABLE FINGERPRINT=$FINGERPRINT npm exec -c 'rollup -c rollup.frontend.config.js'
fi

mkdir -p frontend/dist/$FINGERPRINT
mv frontend/dist/*.js frontend/dist/*.html frontend/dist/$FINGERPRINT
cp -r frontend/css frontend/images frontend/dist/$FINGERPRINT

####################################
echo "STEP 2 - BUILD BACKEND LAMBDA"
####################################
if npm run | grep -q "build:backend"; then
    npm run build:backend
else
    FINGERPRINT=${FINGERPRINT} npm exec -c 'rollup -c rollup.backend.config.js'
fi
cp frontend/dist/$FINGERPRINT/index.html backend/dist
(cd backend/dist && zip -q -9 -r ${VERSION:-deployment}.zip .)
# exit 0

if [[ -z ${SKIP_LAMBDA_DEPLOY:-} ]]; then
    ####################################
    echo "STEP 3 - DEPLOY BACKEND LAMBDA"
    ####################################
    ZIP_FILE=${ZIP_FILE:-"fileb://${ROOT_DIR:-}backend/dist/${VERSION}.zip"}
    export AWS_PAGER="" 
    NODE_ENV=${ORIGINAL_NODE_ENV:-'production'} # set it back to whatever it was
    SECRETS="${SECRETS_ENV} NETWORK='${DEPLOY_ENV^^}' NODE_ENV='${NODE_ENV}' VERSION_HASH='${FINGERPRINT}'"
    SECRETS=$(echo $SECRETS | sed 's/\s/,/g')

    export AWS_DEFAULT_REGION=us-east-1
    export AWS_REGION=us-east-1

    echo "EAST: aws lambda update-function-code"
    aws lambda update-function-code --function-name ${DEPLOY_SITE_NAME} --zip-file $ZIP_FILE
    aws lambda wait function-updated --function-name ${DEPLOY_SITE_NAME}

    echo "EAST: aws lambda update-function-configuration"
    aws lambda update-function-configuration --function-name ${DEPLOY_SITE_NAME} --environment "Variables={${SECRETS}}"
    aws lambda wait function-updated --function-name ${DEPLOY_SITE_NAME}

    echo "EAST: aws lambda publish-version"
    VERSION_NUMBER=$(aws lambda publish-version --function-name ${DEPLOY_SITE_NAME} --description ${VERSION} --query Version --output text)

    echo "EAST: aws lambda update-alias"
    aws lambda update-alias --function-name ${DEPLOY_SITE_NAME} --function-version ${VERSION_NUMBER} --name ${DEPLOY_ENV,,}

    export AWS_DEFAULT_REGION=us-west-2
    export AWS_REGION=us-west-2

    echo "WEST: aws lambda update-function-code"
    aws lambda update-function-code --function-name ${DEPLOY_SITE_NAME} --zip-file $ZIP_FILE
    aws lambda wait function-updated --function-name ${DEPLOY_SITE_NAME}

    echo "WEST: aws lambda update-function-configuration"
    aws lambda update-function-configuration --function-name ${DEPLOY_SITE_NAME} --environment "Variables={${SECRETS}}"
    aws lambda wait function-updated --function-name ${DEPLOY_SITE_NAME}

    echo "WEST: aws lambda publish-version"
    VERSION_NUMBER=$(aws lambda publish-version --function-name ${DEPLOY_SITE_NAME} --description ${VERSION} --query Version --output text)

    echo "WEST: aws lambda update-alias"
    aws lambda update-alias --function-name ${DEPLOY_SITE_NAME} --function-version ${VERSION_NUMBER} --name ${DEPLOY_ENV,,}
fi

##################################
echo "STEP 4 - DEPLOY FRONTEND"
##################################
(cd ./frontend/dist && aws s3 sync . s3://${DEPLOYABLE}/ --cache-control 'max-age=31536000')

# POST-DEPLOY
if [ -f ./post_deploy.sh ]; then
    echo "Found post_deploy. Running..."
    chmod +x ./post_deploy.sh && ./post_deploy.sh
fi