#!/bin/bash

# Build the docker container
docker build -t gostop_backend .

# Run the docker container
docker run -d \
	--env DATABASE_PATH="/data/.data.DEFAULT.db" \
	--name gostop_backend_container \
	--mount source=gostop_db,target=/data \
	-p 8000:8000 \
	gostop_backend
