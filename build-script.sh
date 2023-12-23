

# create folders and allow their permission
mkdir bitnami
mkdir logs


sudo chown -R u+rwx,g+rwx,o+rwx bitnami
sudo chown -R u+rwx,g+rwx,o+rwx logs


# run docker to build app
docker compose -f docker-compose.prod.yml up -d --build app