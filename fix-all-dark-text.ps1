$file = "client/src/pages/RestaurantDashboard.jsx"
$content = Get-Content $file -Raw

# Update all text colors for dark mode
$content = $content -replace 'text-gray-800([^d])', 'text-gray-800 dark:text-white$1'
$content = $content -replace 'text-gray-700([^d])', 'text-gray-700 dark:text-gray-300$1'
$content = $content -replace 'text-gray-600([^d])', 'text-gray-600 dark:text-gray-400$1'
$content = $content -replace 'text-gray-500([^d])', 'text-gray-500 dark:text-gray-400$1'
$content = $content -replace 'text-gray-400([^d])', 'text-gray-400 dark:text-gray-500$1'

# Fix double dark: classes
$content = $content -replace 'dark:text-white dark:text-white', 'dark:text-white'
$content = $content -replace 'dark:text-gray-300 dark:text-gray-300', 'dark:text-gray-300'
$content = $content -replace 'dark:text-gray-400 dark:text-gray-400', 'dark:text-gray-400'

Set-Content $file $content -NoNewline
Write-Host "All text colors updated for dark mode!"
