

# create folders and allow their permission
mkdir bitnami
mkdir logs

# chmod -R g+rwX 
sudo chown -R g+rwx bitnami
sudo chown -R g+rwx logs


# run docker to build app
docker compose -f docker-compose.prod.yml up -d --build app