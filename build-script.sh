

# create folders and allow their permission
mkdir bitnami
mkdir bitnami/kafka
mkdir bitnami/kafka/data
mkdir bitnami/kafka/config
sudo chmod u+rwx,g+rwx,o+rx bitnami
sudo chmod u+rwx,g+rwx,o+rx bitnami/kafka

mkdir logs
sudo chmod u+rwx,g+rwx,o+rx logs

# run docker to build app
docker compose -f docker-compose.prod.yml up -d