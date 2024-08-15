FROM docker.io/bitnami/moodle:4.4

RUN apt update && apt install -y git

