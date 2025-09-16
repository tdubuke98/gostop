#!/bin/bash

# Build the docker container
docker build -t gostop_backend .

# Run the docker container
docker run -d \
	-e DATABASE_PATH="/data/.data.DEFAULT.db" \
        -e DD_SERVICE=gostop_backend \
	-e DD_ENV=tdub_aws \
	-e DD_LOGS_INJECTION=true \
       	-e DD_PROFILING_ENABLED=true \
	--name gostop_backend_container \
	--mount source=gostop_db,target=/data \
	-p 8000:8000 \
	gostop_backend
