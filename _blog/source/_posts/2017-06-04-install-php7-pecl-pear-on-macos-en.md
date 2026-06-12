---
layout: post
title: Install PHP7, PECL, PEAR on MacOS
date: 2017-06-13
lang: en
translation_id: install-php7-pecl-pear-on-macos
permalink: en/2017/06/04/install-php7-pecl-pear-on-macos/
tags:
  - PHP
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170604/20170604224801.png
---

Just a memo.
A note to myself so I don't forget.

## Installing PHP 7

```
$ brew update
$ brew install homebrew/php/php70
$ echo 'export PATH="$(brew --prefix homebrew/php/php70)/bin:$PATH"' >> ~/.bashrc
$ source ~/.bashrc
```

```
$ php -v

PHP 7.0.19 (cli) (built: May 21 2017 11:56:11) ( NTS )
Copyright (c) 1997-2017 The PHP Group
Zend Engine v3.0.0, Copyright (c) 1998-2017 Zend Technologies
```

## Installing PECL and PEAR for PHP 7

```
$ curl -O http://pear.php.net/go-pear.phar
```

```
$ sudo php -d detect_unicode=0 go-pear.phar

Below is a suggested file layout for your new PEAR installation.  To
change individual locations, type the number in front of the
directory.  Type 'all' to change all of them or simply press Enter to
accept these locations.

 1. Installation base ($prefix)                   : /usr/local/Cellar/php70/7.0.19_11
 2. Temporary directory for processing            : /tmp/pear/install
 3. Temporary directory for downloads             : /tmp/pear/install
 4. Binaries directory                            : /usr/local/Cellar/php70/7.0.19_11/bin
 5. PHP code directory ($php_dir)                 : /usr/local/Cellar/php70/7.0.19_11/share/pear
 6. Documentation directory                       : /usr/local/Cellar/php70/7.0.19_11/docs
 7. Data directory                                : /usr/local/Cellar/php70/7.0.19_11/data
 8. User-modifiable configuration files directory : /usr/local/Cellar/php70/7.0.19_11/cfg
 9. Public Web Files directory                    : /usr/local/Cellar/php70/7.0.19_11/www
10. System manual pages directory                 : /usr/local/Cellar/php70/7.0.19_11/man
11. Tests directory                               : /usr/local/Cellar/php70/7.0.19_11/tests
12. Name of configuration file                    : /usr/local/etc/php/7.0/pear.conf

// Specify the installation destination
1-12, 'all' or Enter to continue: (enter "1" and press Enter)

(Use $prefix as a shortcut for '/usr/local/Cellar/php70/7.0.19_11', etc.)
Installation base ($prefix) [/usr/local/Cellar/php70/7.0.19_11] : (enter "/usr/local/pear" and press Enter)




Below is a suggested file layout for your new PEAR installation.  To
change individual locations, type the number in front of the
directory.  Type 'all' to change all of them or simply press Enter to
accept these locations.

 1. Installation base ($prefix)                   : /usr/local/pear
 2. Temporary directory for processing            : /tmp/pear/install
 3. Temporary directory for downloads             : /tmp/pear/install
 4. Binaries directory                            : /usr/local/pear/bin
 5. PHP code directory ($php_dir)                 : /usr/local/pear/share/pear
 6. Documentation directory                       : /usr/local/pear/docs
 7. Data directory                                : /usr/local/pear/data
 8. User-modifiable configuration files directory : /usr/local/pear/cfg
 9. Public Web Files directory                    : /usr/local/pear/www
10. System manual pages directory                 : /usr/local/pear/man
11. Tests directory                               : /usr/local/pear/tests
12. Name of configuration file                    : /usr/local/etc/php/7.0/pear.conf

// Specify the binaries directory
1-12, 'all' or Enter to continue: (enter "4" and press Enter)

(Use $prefix as a shortcut for '/usr/local/pear', etc.)
Binaries directory [$prefix/bin] : /usr/local/bin


Below is a suggested file layout for your new PEAR installation.  To
change individual locations, type the number in front of the
directory.  Type 'all' to change all of them or simply press Enter to
accept these locations.

 1. Installation base ($prefix)                   : /usr/local/pear
 2. Temporary directory for processing            : /tmp/pear/install
 3. Temporary directory for downloads             : /tmp/pear/install
 4. Binaries directory                            : /usr/local/bin
 5. PHP code directory ($php_dir)                 : /usr/local/pear/share/pear
 6. Documentation directory                       : /usr/local/pear/docs
 7. Data directory                                : /usr/local/pear/data
 8. User-modifiable configuration files directory : /usr/local/pear/cfg
 9. Public Web Files directory                    : /usr/local/pear/www
10. System manual pages directory                 : /usr/local/pear/man
11. Tests directory                               : /usr/local/pear/tests
12. Name of configuration file                    : /usr/local/etc/php/7.0/pear.conf

// The basic configuration is now done, so start the installation
1-12, 'all' or Enter to continue: (press Enter without entering anything)

// The installation begins.
Beginning install...
Configuration written to /usr/local/etc/php/7.0/pear.conf...
Initialized registry...
Preparing to install...
installing phar:///Users/kenzo.tanaka/azure/go-pear.phar/PEAR/go-pear-tarballs/Archive_Tar-1.4.2.tar...
installing phar:///Users/kenzo.tanaka/azure/go-pear.phar/PEAR/go-pear-tarballs/Console_Getopt-1.4.1.tar...
installing phar:///Users/kenzo.tanaka/azure/go-pear.phar/PEAR/go-pear-tarballs/PEAR-1.10.4.tar...
installing phar:///Users/kenzo.tanaka/azure/go-pear.phar/PEAR/go-pear-tarballs/Structures_Graph-1.1.1.tar...
installing phar:///Users/kenzo.tanaka/azure/go-pear.phar/PEAR/go-pear-tarballs/XML_Util-1.4.2.tar...
install ok: channel://pear.php.net/Archive_Tar-1.4.2
install ok: channel://pear.php.net/Console_Getopt-1.4.1
install ok: channel://pear.php.net/Structures_Graph-1.1.1
install ok: channel://pear.php.net/XML_Util-1.4.2
install ok: channel://pear.php.net/PEAR-1.10.4
PEAR: Optional feature webinstaller available (PEAR's web-based installer)
PEAR: Optional feature gtkinstaller available (PEAR's PHP-GTK-based installer)
PEAR: Optional feature gtk2installer available (PEAR's PHP-GTK2-based installer)
PEAR: To install optional features use "pear install pear/PEAR#featurename"

The 'pear' command is now at your service at /usr/local/bin/pear

** The 'pear' command is not currently in your PATH, so you need to
** use '/usr/local/bin/pear' until you have added
** '/usr/local/bin' to your PATH environment variable.

Run it without parameters to see the available actions, try 'pear list'
to see what packages are installed, or 'pear help' for help.

For more information about PEAR, see:

  http://pear.php.net/faq.php
  http://pear.php.net/manual/

Thanks for using go-pear!
```

## Verifying the PECL Installation

```
$ which pecl
/usr/local/bin/pecl

$ pecl version
PEAR Version: 1.10.4
PHP Version: 7.0.19
Zend Engine Version: 3.0.0
Running on: Darwin pc-12-332.local 16.5.0 Darwin Kernel Version 16.5.0: Fri Mar  3 16:52:33 PST 2017; root:xnu-3789.51.2~3/RELEASE_X86_64 x86_64
```

## Verifying the PEAR Installation

```
$ which pear
/usr/local/bin/pear

PEAR Version: 1.10.4
PHP Version: 7.0.19
Zend Engine Version: 3.0.0
Running on: Darwin pc-12-332.local 16.5.0 Darwin Kernel Version 16.5.0: Fri Mar  3 16:52:33 PST 2017; root:xnu-3789.51.2~3/RELEASE_X86_64 x86_64
```

That's all.
