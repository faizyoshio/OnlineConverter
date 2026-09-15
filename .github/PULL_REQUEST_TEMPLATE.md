---
name: Release
about: Create a release when a version tag is pushed
title: ''
labels: ["automated", "release"]
assignees: []
body:
  - type: input
    id: changes
    attributes:
      label: What's Changed
      description: List of changes since the last release
    validations:
      required: true
  - type: textarea
    id: notes
    attributes:
      label: Release Notes
      description: Add detailed release notes here
      placeholder: |
        ## Features
        - New feature 1
        - New feature 2

        ## Bug Fixes
        - Fixed bug in PDF tool
        - Fixed memory leak in image converter

        ## Breaking Changes
        - API changes...
    validations:
      required: false
  - type: dropdown
    id: severity
    attributes:
      label: Severity
      description: How significant is this release?
      multiple: false
      options:
        - Patch (bug fixes, minor improvements)
        - Minor (new features, backward compatible)
        - Major (breaking changes)
    default: "Patch"