#!/bin/bash

set -e

echo "=================================="
echo "Deploy PKL BPTI"
echo "=================================="

echo ""
echo "Building and starting containers..."
docker compose up -d --build

echo ""
echo "Cleaning unused images..."
docker image prune -f

echo ""
echo "Container status:"
docker ps

echo ""
echo "Application logs:"
docker logs --tail=20 pkl-bpti-app

echo ""
echo "Done."