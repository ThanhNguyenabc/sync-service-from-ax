

# create folders and allow their permission
mkdir bitnami
mkdir logs
sudo chmod u+rwx,g+rwx,o+rx bitnami
sudo chmod u+rwx,g+rwx,o+rx logs

# run docker to build app
docker compose -f docker-compose.prod.yml up -d