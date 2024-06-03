

# create folders and allow their permission
mkdir bitnami
mkdir logs


# run docker to build app
docker compose -f docker-compose.prod.yml up -d