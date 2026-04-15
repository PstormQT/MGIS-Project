@echo off
REM Delete old documentation files, keep only IMPLEMENTATION.md and DATABASE_DDL.sql
cd /d "d:\RIT\Junior\Spring\MGIS-445\project\MGIS-Project"

del "00_START_HERE.md" 2>nul
del "CHECKLIST.md" 2>nul
del "DELIVERY.md" 2>nul
del "DOCUMENTATION.md" 2>nul
del "HOW_TO_USE.md" 2>nul
del "IMPLEMENTATION_COMPLETE.md" 2>nul
del "IMPLEMENTATION_GUIDE.md" 2>nul
del "INDEX.md" 2>nul
del "PROJECT_SUMMARY.md" 2>nul
del "QUICK_REFERENCE.md" 2>nul
del "QUICK_START.md" 2>nul
del "README.md" 2>nul
del "README.txt" 2>nul
del "README_IMPLEMENTATION.md" 2>nul
del "START_HERE.md" 2>nul
del "SUMMARY.md" 2>nul
del "FINAL_SUMMARY.txt" 2>nul

echo Cleanup complete! Only IMPLEMENTATION.md and DATABASE_DDL.sql remain.
