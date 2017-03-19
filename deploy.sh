#!/usr/bin/env bash
PACKAGE_NAME=$(cat package.json | grep \"name\" | grep -o "[^\"]*\"[,]\?$" | grep -o "^[^\"]\+")
LOCAL_VERSION=$(cat package.json | grep version | grep -o "[0-9]\+\.[0-9]\+\.[0-9]\+[^\"]*")
PUBLIC_VERSION=$(yarn info ${PACKAGE_NAME} version | grep -e '^\d*\.\d*\.\d*')

if [[ -z "$NPM_USER" ]] || [[ -z "$NPM_PASS" ]] || [[ -z "$NPM_EMAIL" ]]
    then echo "NO DEPLOYMENT - npm credentials not provided"
elif [[ ${LOCAL_VERSION} == ${PUBLIC_VERSION} ]]
    then echo "NO DEPLOYMENT - package version not incremented"
else
    echo -e "$NPM_USER\n$NPM_EMAIL" | yarn login
    echo -e  "\n$NPM_PASS"| yarn publish
fi
