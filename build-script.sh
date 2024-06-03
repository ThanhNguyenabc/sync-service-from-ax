

# create folders and allow their permission
mkdir bitnami
mkdir logs

# chmod -R g+rwX 
sudo chmod -R g+rwX bitnami
sudo chmod -R g+rwX logs


# run docker to build app
docker compose -f docker-compose.prod.yml up -d --build app