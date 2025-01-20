# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:41942f7a2f5163aacd0e866e076d95db4f26550b97d76c1594c04250cbb580e9

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
