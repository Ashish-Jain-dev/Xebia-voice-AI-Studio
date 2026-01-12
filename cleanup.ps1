# Xebia Voice AI Studio - Repository Cleanup Script
# Run this before pushing to GitHub to remove debug/temporary files

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Xebia Voice AI Studio - Cleanup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$removedCount = 0

# Define files to remove
$filesToRemove = @(
    # Backend temporary files
    "backend\add_avatar_column.py",
    "backend\add_mcp_column.py",
    "backend\migrate_avatar.py",
    "backend\test_agent_config.py",
    "backend\test_embeddings.py",
    "backend\worker.py.backup",
    
    # Debug documentation
    "AVATAR_CORRECT_FIX.md",
    "AVATAR_DEBUG_GUIDE.md",
    "AVATAR_DECISION_GUIDE.md",
    "AVATAR_FINAL_FIX.md",
    "AVATAR_INTEGRATION_ANALYSIS.md",
    "AVATAR_ISSUE_FOUND.md",
    "AVATAR_SETUP_COMPLETE.md",
    "AVATAR_SELECTION_COMPLETE.md",
    "AVATAR_SELECTION_QUICK_START.md",
    "AVATAR_SELECTION_READY.md",
    
    "BUG_FIX_DASHBOARD_BLANK_SCREEN.md",
    "COMPREHENSIVE_DEBUG_GUIDE.md",
    "CRITICAL_ISSUES_FIXED.md",
    "CURRENT_STATUS.md",
    
    "EDIT_AGENT_FIX.md",
    "EDIT_AGENT_QUICK_SUMMARY.md",
    "EMBEDDING_QUOTA_FIX_SUMMARY.md",
    
    "FINAL_CHECKLIST.md",
    "FINAL_POLISH_FIXES.md",
    "FIXES_APPLIED.md",
    "FRONTEND_ANALYSIS_REPORT.md",
    "FRONTEND_INTEGRATION.md",
    "FRONTEND_ISSUES_FIXED.md",
    "FULLSCREEN_FIX.md",
    
    "GEMINI_REALTIME_UPDATE.md",
    
    "IMPLEMENTATION_COMPLETE.md",
    "INTEGRATION_QUICK_REFERENCE.md",
    
    "KEY_ISSUES_RESOLVED.md",
    "KNOWLEDGE_BASE_QUICK_START.md",
    
    "LIVEKIT_CLOUD_MIGRATION_PLAN.md",
    "LIVEKIT_CONFIGURATION.md",
    
    "MCP_GITHUB_FIX_SUMMARY.md",
    "MCP_GITHUB_PARAMETER_FIX.md",
    "MCP_IMPLEMENTATION_COMPLETE.md",
    "MCP_IMPLEMENTATION_REPORT.md",
    "MCP_IMPLEMENTATION_SUMMARY.md",
    "MCP_QUICK_REFERENCE.md",
    
    "METADATA_FIX_FINAL.md",
    
    "OPTIONAL_DOCUMENTS_FIX.md",
    
    "PHASE_5_COMPLETE.md",
    "PHASE_6_COMPLETE.md",
    "PROJECT_STATUS_COMPLETE.md",
    
    "QUOTA_FIX_GUIDE.md",
    
    "UI_ALIGNMENT_FIX.md",
    "UI_MOCKUPS_COMPLETE.md",
    "UI_MOCKUPS_QUICK_GUIDE.md",
    
    "WEBSITE_QUICK_START.md"
)

Write-Host "Removing temporary and debug files..." -ForegroundColor Yellow
Write-Host ""

foreach ($file in $filesToRemove) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "✓ Removed: $file" -ForegroundColor Green
        $removedCount++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cleanup Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Files removed: $removedCount" -ForegroundColor Green
Write-Host ""

# Verify sensitive files are NOT present
Write-Host "Verifying sensitive files are properly ignored..." -ForegroundColor Yellow
Write-Host ""

$sensitiveFiles = @(
    ".env",
    "backend\.env",
    "xebia_voice_platform_Ui_frontend\.env",
    "Xebia_information_website_UI_Frontend\.env",
    "xebia_voice_ai.db",
    "backend\xebia_voice_ai.db"
)

$foundSensitive = $false
foreach ($file in $sensitiveFiles) {
    if (Test-Path $file) {
        Write-Host "⚠ WARNING: Sensitive file found: $file" -ForegroundColor Red
        Write-Host "   This file should NOT be committed to Git!" -ForegroundColor Red
        $foundSensitive = $true
    }
}

if (-not $foundSensitive) {
    Write-Host "✓ No sensitive files found in repository" -ForegroundColor Green
}

Write-Host ""

# Check for .env.example files
Write-Host "Verifying .env.example files exist..." -ForegroundColor Yellow
Write-Host ""

$envExamples = @(
    "backend\.env.example",
    "xebia_voice_platform_Ui_frontend\.env.example"
)

$allExamplesPresent = $true
foreach ($file in $envExamples) {
    if (Test-Path $file) {
        Write-Host "✓ Found: $file" -ForegroundColor Green
    } else {
        Write-Host "✗ Missing: $file" -ForegroundColor Red
        $allExamplesPresent = $false
    }
}

Write-Host ""

# Final summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cleanup Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not $foundSensitive -and $allExamplesPresent) {
    Write-Host "✓ Repository is ready for GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Review files: git status" -ForegroundColor White
    Write-Host "2. Add files: git add ." -ForegroundColor White
    Write-Host "3. Commit: git commit -m 'Initial commit'" -ForegroundColor White
    Write-Host "4. Push: git push -u origin main" -ForegroundColor White
} else {
    Write-Host "⚠ Issues found! Please resolve before pushing." -ForegroundColor Red
    if ($foundSensitive) {
        Write-Host "   - Remove or add sensitive files to .gitignore" -ForegroundColor Yellow
    }
    if (-not $allExamplesPresent) {
        Write-Host "   - Create missing .env.example files" -ForegroundColor Yellow
    }
}

Write-Host ""
