---
layout: post
title: Adding Access Points to Nginx Access Logs with GeoIP
date: 2015-10-01
category: Infrastructure
lang: en
translation_id: nginx-geip
permalink: en/2015/10/01/nginx-geip/
cover: /img/cover/2015-10-01-nginx-geip.svg
tags:
- Nginx
---


## Overview
After configuring the GeoIP Library, display the access point in access.log

## Obtaining the GeoIP Data Files

You can download them from the MaxMind site, which provides the GeoIP library.
There is a paid version, but for now we'll try the free version.

```
# mkdir -p /usr/share/GeoIP/
# cd /usr/share/GeoIP/
# wget -N http://geolite.maxmind.com/download/geoip/database/GeoLiteCountry/GeoIP.dat.gz
# wget http://geolite.maxmind.com/download/geoip/database/GeoLiteCity.dat.gz
# gunzip GeoIP.dat.gz
# gunzip GeoLiteCity.dat.gz
```

## nginx.conf Configuration

* The log format is set to `ltsv`.

```
# vim /etc/nginx/nginx.conf
```

```
http {

    ...
    ...

    geoip_country /usr/share/GeoIP/GeoIP.dat;
    geoip_city    /usr/share/GeoIP/GeoLiteCity.dat;

    log_format ltsv 'time:$time_iso8601\t'
                    'remote_addr:$remote_addr\t'
                    'request_method:$request_method\t'
                    'request_length:$request_length\t'
                    'request_uri:$request_uri\t'
                    'https:$https\t'
                    'uri:$uri\t'
                    'query_string:$query_string\t'
                    'status:$status\t'
                    'bytes_sent:$bytes_sent\t'
                    'body_bytes_sent:$body_bytes_sent\t'
                    'referer:$http_referer\t'
                    'useragent:$http_user_agent\t'
                    'forwardedfor:$http_x_forwarded_for\t'
                    'request_time:$request_time\t'
                    'upstream_response_time:$upstream_response_time\t'
                    'host:$host\t'

                    # geoIP setting --- start ---
                    'geoip_country_name:$geoip_city_country_name\t'    # Country name
                    'geoip_country_code3:$geoip_city_country_code3\t'  # e.g. JPN, USA
                    'geoip_city:$geoip_city\t'                         # City name
                    'geoip_latitude:$geoip_latitude\t'                 # Latitude
                    'geoip_longitude:$geoip_longitude';                # Longitude
                    # geoIP setting --- end ---


    access_log  /var/log/nginx/access.log  ltsv;
    ...
    ...

    include /etc/nginx/conf.d/*.conf;
}
```

## Restarting Nginx

```
# systemctl restart nginx
```

## Checking the Access Log

```
# tail -f /var/log/nginx/access.log

time:2015-10-01T18:01:48+09:00  remote_addr:xxx.xxx.xx.xx       request_method:GET      request_length:882     request_uri:/public/img/icon/favicon.ico        https:  uri:/public/img/icon/favicon.ico       query_string:-  status:200      bytes_sent:4791 body_bytes_sent:4096    referer:http://theflag.jp/     useragent:Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 Safari/537.36    forwardedfor:-  request_time:0.001     upstream_response_time:0.001    host:theflag.jp geoip_country_name:Japan        geoip_country_code3:JPN        geoip_city:Tokyo        geoip_latitude:35.6850  geoip_longitude:139.7514
```

We got it!

Now let's stream this with fluentd and display it nicely in Kibana.

That's all.
