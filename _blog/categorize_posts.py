#!/usr/bin/env python3
"""
Categorize uncategorized blog posts based on filename, title, tags, and content.
Target: ~10 categories total.
"""
import os
import re
import sys
from pathlib import Path

POST_DIR = Path('_blog/source/_posts')

# Category detection rules: ordered by priority
# Each entry: (category_name, [filename_keywords], [tag_or_title_keywords], [content_keywords])
# Matching is done on lowercased text

RULES = [
    ('AWS', [
        'aws', '-s3-', '-ec2-', '-ecs-', '-eks-', '-lambda-', '-rds-',
        '-cloudwatch-', '-cloudfront-', '-route53-', '-elb-', '-alb-',
        '-elasticache-', '-dynamodb-', '-sqs-', '-sns-', '-kinesis-',
        '-glue-', '-athena-', '-redshift-', '-aurora-', '-codepipeline-',
        '-codebuild-', '-codecommit-', '-ssm-', '-waf-', '-vpc-',
        '-cognito-', '-fargate-', '-ecr-', '-cloudtrail-', '-cloudformation-',
        '-beanstalk-', '-amplify-', '-eventbridge-', '-ses-', '-acm-',
        '-guardduty-', '-inspector-', '-cost-explorer-', '-iam-',
        '-api-gateway-', '-apigateway-', '-lightsail-', '-workspaces-',
        '-secrets-manager-', '-parameter-store-', '-systems-manager-',
        '-trusted-advisor-', '-config-', 'ec2', 's3-bucket', 'ecs-', 'eks-',
    ], [
        'aws', 'amazon web services', 's3', 'ec2', 'ecs', 'eks', 'lambda',
        'cloudwatch', 'cloudfront', 'route53', 'alb', 'elb', 'elasticache',
        'dynamodb', 'sqs', 'sns', 'kinesis', 'glue', 'athena', 'redshift',
        'aurora', 'codepipeline', 'codebuild', 'ssm', 'waf', 'vpc', 'cognito',
        'fargate', 'ecr', 'cloudtrail', 'cloudformation', 'beanstalk',
        'eventbridge', 'ses', 'acm', 'guardduty', 'inspector', 'iam',
        'api gateway', 'apigateway', 'lightsail', 'secrets manager',
        'systems manager', 'parameter store', 'trusted advisor',
    ], []),

    ('Go', [
        '-go-', '-go.', 'go-revel', 'go-get', 'go-framework', 'golang',
        'gopher', 'goroutine', 'grpc', 'gosql', 'goji-', '-goji',
        'install-go-', 'beginner-gopher', 'go-revel', 'go-test',
        'go-aws', 'go-gin', 'go-echo', 'go-fiber', 'go-chi',
        'ebitengine',
    ], [
        'golang', 'go言語', 'go language', 'gopher', 'goroutine', 'grpc',
        'goji', 'revel framework', 'go modules', 'go mod', 'ebitengine',
    ], []),

    ('Python', [
        'python', 'pip-', '-pip-', 'django', 'flask', 'pandas',
        'numpy', 'jupyter', 'pyenv', 'virtualenv', 'poetry-',
        'boto3', 'pytest', 'asyncio', 'fastapi',
    ], [
        'python', 'pip', 'django', 'flask', 'pandas', 'numpy',
        'jupyter', 'pyenv', 'virtualenv', 'poetry', 'boto3',
        'pytest', 'fastapi', 'asyncio',
    ], []),

    ('Terraform', [
        'terraform', 'tfstate', 'tfvars',
    ], [
        'terraform', 'tfstate', 'tfvars', 'hcl', 'terraform module',
    ], []),

    ('RaspberryPI', [
        'raspberry', 'raspi', 'arduino', 'gpio', 'raspbian',
        'orangepi', 'jetson', '-pi-', 'diy-', '-diy',
    ], [
        'raspberry pi', 'raspberrypi', 'raspi', 'arduino', 'gpio',
        'raspbian', 'orange pi', 'diy', 'jetson nano',
    ], []),

    ('Monitoring', [
        'datadog', 'prometheus', 'grafana', 'kibana', 'fluentd',
        'logstash', 'alertmanager', 'zabbix', 'munin', 'newrelic',
        'pagerduty', 'nagios', 'mackerel', '-sentry-', 'install-sentry',
        'cloudwatch-log', 'cloudwatch-alarm', 'cloudwatch-agent',
        'elk-', '-elk-', 'elasticsearch-kibana', 'fluent-bit',
        'victoria-metrics', 'thanos', 'loki-',
    ], [
        'datadog', 'prometheus', 'grafana', 'kibana', 'fluentd',
        'logstash', 'alertmanager', 'zabbix', 'munin', 'newrelic',
        'pagerduty', 'nagios', 'mackerel', 'sentry', 'elk stack',
        'cloudwatch logs', 'cloudwatch alarm', 'cloudwatch agent',
        'fluent bit', 'victoria metrics', 'loki',
    ], []),

    ('Database', [
        'mysql', 'postgresql', 'postgres', 'redis', 'mongodb',
        'sqlite', 'mariadb', 'memcache', 'phpmyadmin', 'mysqldiff',
        'elasticsearch', 'opensearch', 'database', 'cassandra',
        'cockroachdb', 'tidb',
    ], [
        'mysql', 'postgresql', 'postgres', 'redis', 'mongodb',
        'sqlite', 'mariadb', 'memcache', 'phpmyadmin', 'mysqldiff',
        'elasticsearch', 'opensearch', 'database', 'cassandra', 'sql',
        'rdbms', 'nosql',
    ], []),

    ('Git', [
        '-git-', 'git-', 'github-', 'gitlab-', 'bitbucket',
        '-svn-', 'svn-', 'pre-commit', 'git-hooks', 'git-flow',
        'transit-svn-to-git', 'git-rev-parse', 'git-command',
    ], [
        'git', 'github', 'gitlab', 'bitbucket', 'svn', 'pre-commit',
        'git hooks', 'git flow', 'git rebase', 'git merge',
    ], []),

    ('Data Analytics', [
        'analytics', 'bigquery', 'tableau', 'spark-', '-spark-',
        'hadoop', 'machine-learning', 'data-science', '-etl-',
        'data-pipeline', 'dbt-', 'airflow', 'looker',
    ], [
        'analytics', 'bigquery', 'tableau', 'apache spark', 'hadoop',
        'machine learning', 'data science', 'etl', 'data pipeline',
        'dbt', 'apache airflow', 'looker', 'data warehouse',
    ], []),

    ('AI', [
        'chatgpt', 'openai', '-llm-', 'gpt-', '-gpt-', 'bert-',
        'gemini', 'claude-', 'langchain', 'deep-learning',
        'neural-network', 'stable-diffusion', 'dall-e',
        'anthropic', 'bedrock', 'detect-face', 'face-detect',
        'face-triming', 'face-trim',
    ], [
        'chatgpt', 'openai', 'llm', 'gpt', 'bert', 'gemini', 'claude',
        'langchain', 'deep learning', 'neural network', 'stable diffusion',
        'dall-e', 'anthropic', 'amazon bedrock', 'generative ai',
        '生成ai', '機械学習', 'face detection', '顔検出',
    ], []),

    # Infrastructure is the catch-all for DevOps/Linux/Web/etc.
    ('Infrastructure', [
        'docker', 'kubernetes', 'k8s', 'ansible', 'chef', 'vagrant',
        'puppet', 'helm', 'nginx', 'apache', 'linux', 'ubuntu', 'centos',
        'macos', 'macosx', 'homebrew', 'install-homebrew', 'bash', 'zsh',
        'ssh', 'ssl', 'tls', 'openssl', 'cron', 'systemd', 'lamp',
        'php', 'wordpress', 'javascript', 'typescript', 'nodejs', 'node',
        'react', 'seo', 'sonarqube', 'unity', 'ec-cube', 'mamp', 'xampp',
        'logrotate', 'nslookup', 'iproute2', 'net-tools', 'install-wget',
        'ipv6', 'sublimetext', 'sublime-text', 'capslock', 'duns',
        'domain', 'googleplay', 'android', 'ios', 'httpd', 'logrotate',
        'sha256', 'csr', 'openssl', 'robot-txt', 'robots', 'sitemap',
        'find-command', 'zipfile', 'google-analytics',
        'vagrant-chef', 'make-lamp', 'server-', '-server',
        'php-redis', 'install-php', 'phpunit', 'composer',
        'veritrans', 'eccube', 'amazon-linux', 'al2', 'amzn',
        # Ruby/Rails
        'ruby', '-gem-', '-gem.', 'install-ruby', 'rails-', '-rails-',
        'bundler', 'rbenv', 'rvm', 'sinatra', 'rack', 'rspec',
        'recaptcha', 'sendgrid', 'pod-install', 'cocoapods',
        'asdf-', '-asdf',
        # Linux/networking
        'yum', 'cleanup-yum', 'iptables', 'firewall', 'firewalld', 'iftop',
        'iptables', 'ipfw', 'nftables', 'netfilter',
        'sftp', '-ftp-', 'check-whether-the-url',
        'awk-', '-awk-', 'encode', 'sgc-supercerts', 'supercerts',
        'htaccess', 'mod_rewrite', 'certificate', 'antivirus',
        'clam-', 'statsbot', 'slack-', '-slack-',
        'jenkins', 'reduce-disk', 'disk-usage', 'heavy-load',
        'meiwaku-mail', 'outlook', '-mail-', '-cpu-',
        'gke', 'get-host-data', 'user-namespace', 'runtime.v1alpha2',
        'curl-not-match', 'libcurl', 'web-delivery', 'digest-auth',
        'fix-problem-csv',
    ], [
        'docker', 'kubernetes', 'k8s', 'ansible', 'chef', 'vagrant',
        'puppet', 'helm', 'nginx', 'apache', 'linux', 'ubuntu', 'centos',
        'macos', 'homebrew', 'bash', 'zsh', 'ssh', 'ssl', 'tls', 'openssl',
        'cron', 'systemd', 'lamp', 'php', 'wordpress', 'javascript',
        'typescript', 'nodejs', 'react', 'seo', 'sonarqube', 'unity',
        'ec-cube', 'mamp', 'xampp', 'logrotate', 'nslookup', 'net-tools',
        'ipv6', 'sublime text', 'duns', 'domain', 'google play', 'android',
        'ios', 'httpd', 'openssl', 'robots.txt', 'sitemap', 'google analytics',
        'vagrant', 'lamp', 'php', 'phpunit', 'composer', 'veritrans',
        'amazon linux',
        'ruby', 'rails', 'gem', 'bundler', 'rbenv', 'sinatra', 'rspec',
        'recaptcha', 'sendgrid', 'cocoapods', 'asdf',
        'iptables', 'firewall', 'iftop', 'sftp', 'ftp',
        'awk', 'csv', 'encode', 'encoding', 'certificate', 'antivirus',
        'jenkins', 'slack', 'disk usage', 'cpu', 'gke',
        'user namespace', 'web delivery', 'digest authentication',
    ], []),
]


def get_frontmatter(content):
    """Extract frontmatter as dict from post content."""
    if not content.startswith('---'):
        return {}, content
    end = content.find('\n---', 3)
    if end == -1:
        return {}, content
    fm_text = content[3:end]
    return fm_text, content[end + 4:]


def has_category(content):
    """Check if post already has a category set."""
    match = re.search(r'^category:', content, re.MULTILINE)
    return match is not None


def get_category_value(content):
    """Get existing category value."""
    match = re.search(r'^category:\s*(.+)$', content, re.MULTILINE)
    if match:
        return match.group(1).strip()
    return None


def classify_post(filepath):
    """Determine categories for a post based on filename, tags, and title."""
    fname = filepath.stem.lower()

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract frontmatter fields
    fm_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    fm_text = fm_match.group(1).lower() if fm_match else ''

    # Get first 50 lines of content (after frontmatter) for additional context
    lines = content.split('\n')
    fm_end = 0
    dash_count = 0
    for i, line in enumerate(lines):
        if line.strip() == '---':
            dash_count += 1
            if dash_count == 2:
                fm_end = i
                break
    content_preview = '\n'.join(lines[fm_end:fm_end+50]).lower()

    matched_categories = []

    for cat, fname_kws, meta_kws, content_kws in RULES:
        matched = False

        # Check filename
        for kw in fname_kws:
            if kw in fname:
                matched = True
                break

        # Check frontmatter (title + tags)
        if not matched:
            for kw in meta_kws:
                if kw in fm_text:
                    matched = True
                    break

        # Check content preview
        if not matched and content_kws:
            for kw in content_kws:
                if kw in content_preview:
                    matched = True
                    break

        if matched:
            matched_categories.append(cat)

    # Special Go detection: be precise
    # If "Go" was matched but might be a false positive, validate
    if 'Go' in matched_categories:
        go_patterns = [
            r'\bgo\b', r'golang', r'gopher', r'goroutine', r'goji', r'revel',
            r'go (言語|language|framework|module)', r'go get', r'go build',
            r'go test', r'go run', r'package main',
        ]
        go_confirmed = any(
            re.search(p, fm_text + ' ' + content_preview)
            for p in go_patterns
        )
        if not go_confirmed:
            matched_categories.remove('Go')

    return matched_categories


def add_category_to_file(filepath, categories):
    """Add category to a post's frontmatter."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if len(categories) == 1:
        category_line = f'category: {categories[0]}'
    else:
        # Use Hexo's format for multiple INDEPENDENT categories: [[cat1], [cat2]]
        # This prevents Hexo from treating them as nested hierarchy
        cats_str = '\n'.join(f'  - [{c}]' for c in categories)
        category_line = f'categories:\n{cats_str}'

    # Insert after 'date:' line or after 'title:' line
    new_content = re.sub(
        r'^(date:\s*.+)$',
        rf'\1\n{category_line}',
        content,
        count=1,
        flags=re.MULTILINE,
    )

    if new_content == content:
        # date not found, try after title
        new_content = re.sub(
            r'^(title:\s*.+)$',
            rf'\1\n{category_line}',
            content,
            count=1,
            flags=re.MULTILINE,
        )

    if new_content == content:
        print(f'  WARNING: Could not insert category for {filepath.name}')
        return False

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    return True


def main():
    dry_run = '--dry-run' in sys.argv
    verbose = '--verbose' in sys.argv

    # Exclude non-post pages
    EXCLUDE = {'PrivacyPolicy.md', 'about.md'}
    posts = sorted(p for p in POST_DIR.glob('*.md') if p.name not in EXCLUDE)
    uncategorized = [p for p in posts if not has_category(open(p).read())]

    print(f'Total posts: {len(posts)}')
    print(f'Uncategorized: {len(uncategorized)}')
    print(f'Mode: {"DRY RUN" if dry_run else "APPLY"}')
    print()

    stats = {}
    no_match = []

    for filepath in uncategorized:
        categories = classify_post(filepath)

        if not categories:
            no_match.append(filepath.name)
            if verbose:
                print(f'NO MATCH: {filepath.name}')
            continue

        for cat in categories:
            stats[cat] = stats.get(cat, 0) + 1

        if verbose:
            print(f'{filepath.name}: {", ".join(categories)}')

        if not dry_run:
            add_category_to_file(filepath, categories)

    print('\n=== Category Stats ===')
    for cat, count in sorted(stats.items(), key=lambda x: -x[1]):
        print(f'  {cat}: {count}')

    print(f'\n=== Unmatched ({len(no_match)}) ===')
    for name in no_match:
        print(f'  {name}')


if __name__ == '__main__':
    main()
