#!/bin/bash

# Script to verify if a revert was completely successful
# Checks Git status, diffs, and runs build tests

echo "[Git Status]"
git status --porcelain

echo ""
echo "[Diff vs HEAD^]"
git diff --stat HEAD^

echo ""
echo "[Untracked]"
git ls-files --others --exclude-standard

# Check if package-lock.json exists
if [ -f "package-lock.json" ]; then
  echo ""
  echo "Running dependency & build tests..."
  
  # Install dependencies according to lockfile
  npm ci
  CI_EXIT_CODE=$?
  
  if [ $CI_EXIT_CODE -ne 0 ]; then
    echo "[INSTALL] FAILED with exit code $CI_EXIT_CODE"
    echo "FAILED"
    exit 1
  else
    echo "[INSTALL] success"
  fi
  
  # Run lint if available
  if grep -q "\"lint\":" package.json; then
    npm run lint
    LINT_EXIT_CODE=$?
    
    if [ $LINT_EXIT_CODE -ne 0 ]; then
      echo "[LINT] FAILED with exit code $LINT_EXIT_CODE"
      echo "FAILED"
      exit 1
    else
      echo "[LINT] success"
    fi
  fi
  
  # Run tests if available
  if grep -q "\"test\":" package.json; then
    npm run test
    TEST_EXIT_CODE=$?
    
    if [ $TEST_EXIT_CODE -ne 0 ]; then
      echo "[TEST] FAILED with exit code $TEST_EXIT_CODE"
      echo "FAILED"
      exit 1
    else
      echo "[TEST] success"
    fi
  fi
  
  # Run build
  npm run build
  BUILD_EXIT_CODE=$?
  
  if [ $BUILD_EXIT_CODE -ne 0 ]; then
    echo "[BUILD] FAILED with exit code $BUILD_EXIT_CODE"
    echo "FAILED"
    exit 1
  else
    echo "[BUILD] success"
  fi
  
  echo "CLEAN"
else
  echo ""
  echo "package-lock.json not found, skipping dependency & build tests"
  
  # If we can't run tests, check if Git is clean
  if [ -z "$(git status --porcelain)" ] && [ -z "$(git diff --stat HEAD^)" ] && [ -z "$(git ls-files --others --exclude-standard)" ]; then
    echo "CLEAN"
  else
    echo "FAILED"
  fi
fi