# WP-AOFM-CDMX

## Project

Water Polo Photography Platform

---

# Version

Current Development Version

v1.1-dev

Production Version

v1.0

---

# Vision

Create the best free water polo photography platform for clubs and families.

The platform must be:

- Fast
- Simple
- Automatic
- Easy to maintain
- Free whenever possible

---

# Production Branch

main

This branch contains the stable production website.

No experimental features should be developed here.

---

# Development Branch

v1.1-dev

All new features are developed and tested here before merging into production.

---

# Current Architecture

GitHub
    ↓
Vercel
    ↓
gallery.html
    ↓
api/images.js
    ↓
Cloudinary

---

# Folder Convention

WP2026/

    CN2026/

    CONADE2026/

Each tournament contains categories.

Each category contains

gallery/

download/

---

# URL Convention

gallery.html?t=TOURNAMENT&cat=CATEGORY

Example

gallery.html?t=CN2026&cat=infmayor

---

# Design Principles

- One gallery engine
- No duplicated code
- Automatic tournament support
- Automatic category support
- Cloudinary folder driven
- Mobile first
- Free infrastructure first

---

# Version History

## Version 1.0

Status

Frozen

Main Features

- Shared gallery
- Dynamic categories
- Dynamic tournaments
- Lightbox
- Downloads
- Responsive layout

---

# Version 1.1

Status

In Development

Objectives

- Health Check
- Dashboard
- Statistics
- Upload Assistant
- Folder Validation

---

# Notes

This document is the official reference for the project.
Last updated: July 2026