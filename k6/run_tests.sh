#!/bin/bash

TARGET=4000 DURATION=10m HTTP_PORT=9926 DOMAIN=https://shard-nado-us-lax01.harperdbcloud.com BASIC_AUTH='Basic ...' K6_PROMETHEUS_RW_SERVER_URL=http://172.233.143.77:9090/api/v1/write K6_PROMETHEUS_RW_TREND_AS_NATIVE_HISTOGRAM=true k6 run -o experimental-prometheus-rw leaderWrites.js

sleep 300

TARGET=4000 DURATION=10m HTTP_PORT=9926 DOMAIN=https://shard-nado-us-lax01.harperdbcloud.com BASIC_AUTH='Basic ...' K6_PROMETHEUS_RW_SERVER_URL=http://172.233.143.77:9090/api/v1/write K6_PROMETHEUS_RW_TREND_AS_NATIVE_HISTOGRAM=true k6 run -o experimental-prometheus-rw leaderWrites.js

sleep 300

TARGET=4250 DURATION=10m HTTP_PORT=9926 DOMAIN=https://shard-nado-us-lax01.harperdbcloud.com BASIC_AUTH='Basic ...' K6_PROMETHEUS_RW_SERVER_URL=http://172.233.143.77:9090/api/v1/write K6_PROMETHEUS_RW_TREND_AS_NATIVE_HISTOGRAM=true k6 run -o experimental-prometheus-rw multiWrongWrites.js

sleep 300

TARGET=3000 DURATION=10m HTTP_PORT=9926 DOMAIN=https://shard-nado-us-lax01.harperdbcloud.com BASIC_AUTH='Basic ...' K6_PROMETHEUS_RW_SERVER_URL=http://172.233.143.77:9090/api/v1/write K6_PROMETHEUS_RW_TREND_AS_NATIVE_HISTOGRAM=true k6 run -o experimental-prometheus-rw singleBlobWrites.js

sleep 300

TARGET=800 DURATION=10m HTTP_PORT=9926 DOMAIN=https://shard-nado-us-lax01.harperdbcloud.com BASIC_AUTH='Basic ...' K6_PROMETHEUS_RW_SERVER_URL=http://172.233.143.77:9090/api/v1/write K6_PROMETHEUS_RW_TREND_AS_NATIVE_HISTOGRAM=true k6 run -o experimental-prometheus-rw singleBytesWrites.js

