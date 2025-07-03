# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Hexo-based static blog site for `kenzo0107.github.io` - a Japanese tech blog covering AWS, Go, Python, infrastructure, and IoT topics.

## Architecture

**Two-tier Structure:**
- `_blog/`: Hexo source files, configuration, and development environment
- Root directory: Generated static files served by GitHub Pages

**Key Components:**
- **Static Generator**: Hexo 6.3.0 with Icarus theme 5.1.0
- **Content**: Markdown posts in `_blog/source/_posts/`
- **Deployment**: GitHub Actions CI/CD pipeline
- **Hosting**: GitHub Pages (master branch serves static files)

## Development Commands

All commands must be run from the `_blog/` directory:

```bash
cd _blog
npm run server    # Start development server (hexo server)
npm run build     # Generate static files (hexo generate)  
npm run clean     # Clear cache (hexo clean)
npm run deploy    # Deploy to Git (hexo deploy)
```

## Deployment Workflow

1. **Development**: Work in `_blog/` directory
2. **Local Testing**: `npm run server` to preview changes
3. **Build**: `npm run build` generates static files to repository root
4. **Deploy**: Push to `release` branch triggers GitHub Actions
5. **Publication**: GitHub Actions builds and deploys to `master` branch

## Content Structure

**Blog Posts**: `_blog/source/_posts/YYYY-MM-DD-title.md`

**Post Format:**
```yaml
---
title: 記事タイトル  
category: AWS/Go/Python
date: YYYY-MM-DD
tags: [tag1, tag2]
---
<!-- more -->
Content here...
```

## Configuration Files

- `_blog/_config.yml`: Main Hexo configuration
- `_blog/_config.icarus.yml`: Theme configuration  
- `_blog/package.json`: Node.js dependencies
- `.github/workflows/deploy.yml`: CI/CD pipeline

## Branch Strategy

- `release`: Development and content updates
- `master`: Production static files (auto-deployed)

## Content Categories

Primary topics: AWS, Go, Python, Terraform, Monitoring (Datadog, Prometheus), RaspberryPI, Infrastructure