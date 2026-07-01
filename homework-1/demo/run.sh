#!/usr/bin/env bash
# Starts the Banking Transactions API on http://localhost:3000
set -e
cd "$(dirname "$0")/../backend"
mvn spring-boot:run
