# Quick Task: Versions Tab

**Date:** 2026-04-01
**Status:** Complete

## Description

Rename Deployments tab to Versions, add Branches section with Vercel API branch grouping.

## Solution

- Created `VersionsTab.tsx` with Branches section (grouped deployments by branch) and Deployments section
- Renamed tab from "Deployments" to "Versions"
- API fetches 50 deployments for branch grouping
- Yellow banner for feature branch viewing
