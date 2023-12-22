

# create folders and allow their permission
mkdir binami
mkdir logs
sudo chmod a+w bitnami
sudo chmod a+w logs

# run docker to build app
docker compose -f docker-compose.prod.yml up -d