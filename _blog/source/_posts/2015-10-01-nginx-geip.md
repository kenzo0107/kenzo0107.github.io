---
layout: post
title: NginxでGeoIP設定しアクセスログにアクセスポイントを追加する
date: 2015-10-01
tags:
- Nginx
---


## 概要
GeoIP Libraryを設定後、access.logにアクセスポイントを表示

## GeoIP データファイル取得

GeoIPライブラリを提供しているMaxMindサイトから取得可能です。
有料版もありますが、取り急ぎは無料版で試します。

```
# mkdir -p /usr/share/GeoIP/
# cd /usr/share/GeoIP/
# wget -N http://geolite.maxmind.com/download/geoip/database/GeoLiteCountry/GeoIP.dat.gz
# wget http://geolite.maxmind.com/download/geoip/database/GeoLiteCity.dat.gz
# gunzip GeoIP.dat.gz
# gunzip GeoLiteCity.dat.gz
```

## nginx.conf設定

※ログのフォーマットは`ltsv`にしています。

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
                    'geoip_country_name:$geoip_city_country_name\t'    # 国名
                    'geoip_country_code3:$geoip_city_country_code3\t'  # JPNとかUSAとか
                    'geoip_city:$geoip_city\t'                         # 都市名
                    'geoip_latitude:$geoip_latitude\t'                 # 緯度
                    'geoip_longitude:$geoip_longitude';                # 経度
                    # geoIP setting --- end ---


    access_log  /var/log/nginx/access.log  ltsv;
    ...
    ...

    include /etc/nginx/conf.d/*.conf;
}
```

## Nginx再起動

```
# systemctl restart nginx
```

## アクセスログ確認

```
# tail -f /var/log/nginx/access.log

time:2015-10-01T18:01:48+09:00  remote_addr:xxx.xxx.xx.xx       request_method:GET      request_length:882     request_uri:/public/img/icon/favicon.ico        https:  uri:/public/img/icon/favicon.ico       query_string:-  status:200      bytes_sent:4791 body_bytes_sent:4096    referer:http://theflag.jp/     useragent:Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 Safari/537.36    forwardedfor:-  request_time:0.001     upstream_response_time:0.001    host:theflag.jp geoip_country_name:Japan        geoip_country_code3:JPN        geoip_city:Tokyo        geoip_latitude:35.6850  geoip_longitude:139.7514
```

取得できました♪

これをfluentdで流してKibanaでかっこよく表示しましょう。

以上です。
